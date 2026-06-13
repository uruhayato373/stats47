#!/usr/bin/env tsx
/**
 * Correlation snapshot producer (完全DBレス: Derived = エフェメラル計算 → R2)。
 * 正典: docs/01_技術設計/12_完全DBレス設計.md
 *
 * Phase 7 (commit 70758ac0) で D1 correlations テーブルと共に消えた
 * `run-batch-correlation.ts` + `correlation-snapshot.ts` + `per-key-snapshot.ts` の
 * 後継。永続 D1 を一切持たず、以下のフローで R2 snapshot を再生成する:
 *
 *   入力 : R2 `app/stats/<metric>/values.json` (公開 URL read) + git TS (data-configs)
 *   集計 : 使い捨て :memory: better-sqlite3 (旧 correlations schema 同等の temp table)
 *   出力 : R2 `app/correlation/top-pairs.json` / `stats.json` / `by-ranking-key/<key>.json`
 *
 * 計算量: ~2,000 active 指標² ≈ 2M ペアだが各 pearson は ≤47 点で安価。全ペアを
 * :memory: に materialize すると重すぎるため、JS 側で
 *   - per-key top-20 (ABS pearsonR 降順)
 *   - global top-200 候補 (effectiveR 降順)
 *   - 走行中の total / strong(|r|>=0.7) カウント
 * だけを保持し、最終的に「候補行のみ」を :memory: correlations に INSERT して
 * 旧 exporter SQL (effectiveR / ORDER BY / strong 集計) を厳密に再現する。
 *
 * R2 書き込みは assertR2WriteAllowed で CI / クラウド専用 (ローカルは .local/r2 へ生成のみ)。
 *
 * Usage (CI / sync-snapshots):
 *   R2_PUBLIC_FETCH_URL=https://storage.stats47.jp NODE_OPTIONS='--conditions react-server' \
 *     npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *       packages/correlation/src/scripts/build-correlation-snapshot.ts
 *   ... --dry-run            # R2 / .local/r2 に書かず件数のみ
 *   ... --limit-metrics 200  # 先頭 N 指標のみ (デバッグ用)
 */
import "server-only";

import DatabaseConstructor from "better-sqlite3";

import { listAllMetrics, getMetricConfig, getMetricMeta } from "@stats47/data-configs";
import type { MetricConfig } from "@stats47/data-configs";
import { assertR2WriteAllowed, fetchFromR2AsJson, saveToR2 } from "@stats47/r2-storage/server";
import { readStatsValues } from "@stats47/stats-r2/readers";

import { isExcludedCorrelationKey, isExcludedCorrelationPair } from "../trivial-pairs";
import {
  buildScatterData,
  calculatePartialR,
  calculatePearsonR,
  type RankValueWithArea,
} from "../utils/calculate-pearson";
import {
  CORRELATION_BY_KEY_LIMIT,
  CORRELATION_STATS_KEY,
  CORRELATION_TOP_PAIRS_KEY,
  CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT,
  correlationByKeyPath,
  type CorrelatedItem,
  type CorrelationByKeySnapshot,
  type CorrelationStatsSnapshot,
  type CorrelationTopPairsSnapshot,
  type TopCorrelation,
} from "../types/snapshot";

// ─── 旧 run-batch-correlation.ts の定数 (git show 70758ac0^ で確認) ───────────

/** 散布図の最小データ点数。これ未満のペアは採用しない。 */
const MIN_DATA_POINTS = 30;

/** R2 values.json の並列 fetch 上限 (API rate / メモリ保護)。 */
const FETCH_CONCURRENCY = 16;

/** 偏相関の制御変数 (key → 出力カラム)。旧 CONTROL_VARIABLES と同一。 */
const CONTROL_VARIABLES = [
  { key: "total-population", column: "partialRPopulation" },
  { key: "total-area-excluding-northern-territories-and-takeshima", column: "partialRArea" },
  { key: "ratio-65-plus", column: "partialRAging" },
  { key: "population-density-per-km2-total-area", column: "partialRDensity" },
] as const;

/**
 * 補数関係グループ。同グループ内ペアは合計が一定値 (100% 等) で相関が自明 → 除外。
 * 旧 run-batch-correlation.ts (29-139 行) の COMPLEMENTARY_GROUPS を移植。
 */
const COMPLEMENTARY_GROUPS: string[][] = [
  ["employed-people-ratio-primary", "employed-people-ratio-secondary", "employed-people-ratio-tertiary", "secondary-employed-people-ratio-tertiary"],
  ["secondary-industry-establishment-ratio", "tertiary-industry-establishment-ratio", "secondary-industry-establishment-ratio-census", "tertiary-industry-establishment-ratio-census"],
  ["owner-occupied-housing-ratio", "rented-housing-ratio", "private-rented-housing-ratio"],
  ["detached-house-ratio", "apartment-ratio", "row-house-ratio"],
  ["in-prefecture-employed-people-ratio", "outflow-population-ratio", "inflow-population-ratio"],
  ["personnel-expenditure-ratio-pref-finance", "assistance-expenditure-ratio-pref-finance", "investment-expenditure-ratio-pref-finance", "ordinary-construction-expenditure-ratio-pref-finance"],
  ["establishment-ratio-1-4-employees-private", "establishment-ratio-5-9-employees-private", "establishment-ratio-10-29-employees-private", "establishment-ratio-300plus-employees-private"],
  ["young-population-ratio", "production-age-population-ratio", "ratio-65-plus"],
  ["employee-ratio-1-4-employee-establishments-private", "employee-ratio-5-9-employee-establishments-private", "employee-ratio-10-29-employee-establishments-private", "employee-ratio-100-299-employee-establishments-private", "employee-ratio-300plus-employee-establishments-private"],
  ["national-university-student-ratio", "public-university-student-ratio", "private-university-student-ratio"],
  ["final-education-elementary-junior-high-ratio", "final-education-highschool-old-junior-high-ratio", "final-education-junior-college-technical-college-ratio", "final-education-university-graduate-school-ratio"],
  ["total-assessed-land-area-ratio", "total-assessed-land-area-ratio-residential", "total-assessed-land-area-ratio-paddy", "total-assessed-land-area-ratio-field"],
  ["welfare-expenditure-ratio-pref-finance", "education-expenditure-ratio-pref-finance", "public-works-expenditure-ratio-pref-finance", "police-expenditure-ratio-pref-finance", "sanitation-expenditure-ratio-pref-finance", "agriculture-forestry-fisheries-expenditure-ratio-pref-finance", "commerce-industry-expenditure-ratio-pref-finance", "labor-expenditure-ratio-pref-finance", "disaster-recovery-expenditure-ratio-pref-finance"],
  ["food-expenditure-ratio-multi-person-households", "housing-expenditure-ratio-multi-person-households", "utilities-expenditure-ratio-multi-person-households", "furniture-household-goods-expenditure-ratio-multi-person-households", "clothing-footwear-expenditure-ratio-multi-person-households", "healthcare-expenditure-ratio-multi-person-households", "transport-communication-expenditure-ratio-multi-person-households", "education-expenditure-ratio-multi-person-households", "culture-recreation-expenditure-ratio-multi-person-households", "other-consumption-expenditure-ratio-multi-person-households"],
];

/** 補数関係グループの高速ルックアップ: rankingKey → グループID */
const complementaryGroupMap = new Map<string, number>();
COMPLEMENTARY_GROUPS.forEach((group, idx) => {
  for (const key of group) complementaryGroupMap.set(key, idx);
});

// ─── 軽量メタ (title / subtitle / unit / normalizationBasis) ──────────────────

interface MetricDisplayMeta {
  title: string | null;
  subtitle: string | null;
  unit: string;
  normalizationBasis: string | null;
}

interface RankingItemsAllSnapshot {
  generatedAt: string;
  count: number;
  items: Array<{
    rankingKey: string;
    title?: string;
    subtitle?: string | null;
    unit?: string;
    normalizationBasis?: string | null;
  }>;
}

/**
 * 旧 D1 ranking_items 列 (title / subtitle / unit / normalizationBasis) の代替を
 * R2 `app/ranking-items/all.json` から取得し、無い場合は MetricConfig へフォールバック。
 * 旧 list-top-correlations.ts は metrics.title / metrics.normalizationBasis を JOIN していた。
 */
async function loadDisplayMeta(): Promise<Map<string, MetricDisplayMeta>> {
  const map = new Map<string, MetricDisplayMeta>();
  const snapshot = await fetchFromR2AsJson<RankingItemsAllSnapshot>("app/ranking-items/all.json");
  if (snapshot?.items) {
    for (const it of snapshot.items) {
      map.set(it.rankingKey, {
        title: it.title ?? null,
        subtitle: it.subtitle ?? null,
        unit: it.unit ?? "",
        normalizationBasis: it.normalizationBasis ?? null,
      });
    }
  }
  return map;
}

function displayMetaFor(
  key: string,
  metaMap: Map<string, MetricDisplayMeta>,
): MetricDisplayMeta {
  const fromSnapshot = metaMap.get(key);
  if (fromSnapshot) return fromSnapshot;
  const config = getMetricConfig(key);
  return {
    title: config?.title ?? null,
    subtitle: config?.subtitle ?? null,
    unit: config?.unit ?? "",
    normalizationBasis: null, // builder は normalizationBasis を焼かないため snapshot 由来のみ
  };
}

// ─── 観測値ロード ─────────────────────────────────────────────────────────────

interface LoadedMetric {
  key: string;
  latestYear: string;
  rows: RankValueWithArea[];
  valueMap: Map<string, number>;
}

/**
 * 1 指標の latestYear prefecture 値を R2 から読む。
 * value=null は除外。MIN_DATA_POINTS 未満は null (相関対象外)。
 */
async function loadMetric(config: MetricConfig): Promise<LoadedMetric | null> {
  const latestYear = getMetricMeta(config.key)?.latestYear?.yearCode;
  if (!latestYear) return null;

  const payload = await readStatsValues(config.key, "prefecture");
  if (!payload || payload.rows.length === 0) return null;

  const rows: RankValueWithArea[] = [];
  const valueMap = new Map<string, number>();
  for (const r of payload.rows) {
    if (r.yearCode !== latestYear) continue;
    if (r.value === null || r.value === undefined) continue;
    rows.push({ areaCode: r.areaCode, areaName: r.areaName, value: r.value });
    valueMap.set(r.areaCode, r.value);
  }
  if (rows.length < MIN_DATA_POINTS) return null;
  return { key: config.key, latestYear, rows, valueMap };
}

/** 並列度を制限して loadMetric を流す簡易ワーカープール。 */
async function loadMetricsBounded(
  configs: MetricConfig[],
  concurrency: number,
): Promise<Map<string, LoadedMetric>> {
  const out = new Map<string, LoadedMetric>();
  let cursor = 0;
  async function worker() {
    while (cursor < configs.length) {
      const idx = cursor++;
      const loaded = await loadMetric(configs[idx]);
      if (loaded) out.set(loaded.key, loaded);
    }
  }
  await Promise.all(Array.from({ length: concurrency }, () => worker()));
  return out;
}

// ─── 自明ペア判定 (旧 isTrivialPair) ──────────────────────────────────────────

function isTrivialPair(
  keyA: string,
  keyB: string,
  titleA: string | null,
  titleB: string | null,
): boolean {
  if (titleA !== null && titleA === titleB) return true; // 同タイトル
  const ga = complementaryGroupMap.get(keyA);
  const gb = complementaryGroupMap.get(keyB);
  if (ga !== undefined && ga === gb) return true; // 補数関係
  if (isExcludedCorrelationPair(keyA, keyB)) return true; // 明示除外
  return false;
}

// ─── 偏相関 (制御変数との r) のキャッシュ ─────────────────────────────────────

/** rankingKey × cvKey → r。getCvCorrelation で memoize。 */
function makeCvCorrelationGetter(
  metrics: Map<string, LoadedMetric>,
): (key: string, cvKey: string) => number | null {
  const cache = new Map<string, number | null>();
  return (key: string, cvKey: string): number | null => {
    const cacheKey = `${key}\0${cvKey}`;
    const cached = cache.get(cacheKey);
    if (cached !== undefined) return cached;

    const metric = metrics.get(key);
    const cv = metrics.get(cvKey);
    if (!metric || !cv) {
      cache.set(cacheKey, null);
      return null;
    }
    const x: number[] = [];
    const y: number[] = [];
    for (const [areaCode, xVal] of metric.valueMap) {
      const yVal = cv.valueMap.get(areaCode);
      if (yVal !== undefined) {
        x.push(xVal);
        y.push(yVal);
      }
    }
    if (x.length < MIN_DATA_POINTS) {
      cache.set(cacheKey, null);
      return null;
    }
    const { r } = calculatePearsonR(x, y);
    cache.set(cacheKey, r);
    return r;
  };
}

// ─── 候補ペア (bounded) ───────────────────────────────────────────────────────

interface CandidatePair {
  keyX: string;
  keyY: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatter: Array<{ areaCode: string; areaName: string; x: number; y: number }>;
  /** effectiveR = sign(pearsonR) × min(|partial*| or |pearsonR|) — 旧 exporter SQL 準拠 */
  effectiveAbsR: number;
}

/** 旧 list-top-correlations.ts の effectiveAbsR を JS で先計算 (候補絞り込み用)。 */
function effectiveAbsROf(p: {
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
}): number {
  const absR = Math.abs(p.pearsonR);
  return Math.min(
    p.partialRPopulation === null ? absR : Math.abs(p.partialRPopulation),
    p.partialRArea === null ? absR : Math.abs(p.partialRArea),
    p.partialRAging === null ? absR : Math.abs(p.partialRAging),
    p.partialRDensity === null ? absR : Math.abs(p.partialRDensity),
  );
}

/** 候補集合を作るために per-key top-N (ABS pearsonR 降順) を保持する小ヒープ代替。 */
class TopByAbsPearson {
  private items: CandidatePair[] = [];
  constructor(private readonly limit: number) {}
  add(p: CandidatePair) {
    this.items.push(p);
    this.items.sort((a, b) => Math.abs(b.pearsonR) - Math.abs(a.pearsonR));
    if (this.items.length > this.limit) this.items.length = this.limit;
  }
  values(): CandidatePair[] {
    return this.items;
  }
}

/** global top-N (effectiveAbsR 降順) を保持。candidates 絞り込みにのみ使う。 */
class GlobalTopByEffective {
  private items: CandidatePair[] = [];
  constructor(private readonly limit: number) {}
  add(p: CandidatePair) {
    // 旧 SQL は ABS(pearson_r) < 0.99 を top-pairs で除くため、ここでも候補から外す。
    if (Math.abs(p.pearsonR) >= 0.99) return;
    if (isExcludedCorrelationPair(p.keyX, p.keyY)) return;
    this.items.push(p);
    if (this.items.length > this.limit * 4) {
      this.items.sort((a, b) => b.effectiveAbsR - a.effectiveAbsR);
      this.items.length = this.limit;
    }
  }
  values(): CandidatePair[] {
    this.items.sort((a, b) => b.effectiveAbsR - a.effectiveAbsR);
    return this.items.slice(0, this.limit);
  }
}

// ─── :memory: SQLite (旧 correlations schema 同等の temp table) ────────────────

/**
 * 旧 D1 correlations schema を :memory: に再現し、候補行のみ INSERT。
 * 旧 exporter SQL (effectiveR / ORDER BY / strong 集計 / per-key) を厳密に流用する。
 *
 * schema 出典: packages/database/src/schema/correlations.ts は Phase 7 で削除済みのため
 * 旧 upsert-correlation.ts (git show 70758ac0^) が書いていた列を最小再現:
 *   metric_key_x, metric_key_y, pearson_r, partial_r_population, partial_r_area,
 *   partial_r_aging, partial_r_density, scatter_data_json
 * (+ join 用に metrics(key, title, normalization_basis) も temp 化)
 */
function buildMemoryDb(
  candidates: CandidatePair[],
  metaMap: Map<string, MetricDisplayMeta>,
  allKeys: Set<string>,
): DatabaseConstructor.Database {
  const db = new DatabaseConstructor(":memory:");
  db.pragma("journal_mode = MEMORY");

  db.exec(`
    CREATE TABLE correlations (
      metric_key_x TEXT NOT NULL,
      metric_key_y TEXT NOT NULL,
      pearson_r REAL NOT NULL,
      partial_r_population REAL,
      partial_r_area REAL,
      partial_r_aging REAL,
      partial_r_density REAL,
      scatter_data_json TEXT NOT NULL
    );
    CREATE TABLE metrics (
      key TEXT PRIMARY KEY,
      title TEXT,
      normalization_basis TEXT
    );
    CREATE INDEX idx_corr_x ON correlations(metric_key_x);
    CREATE INDEX idx_corr_y ON correlations(metric_key_y);
  `);

  const insMetric = db.prepare(
    "INSERT OR IGNORE INTO metrics (key, title, normalization_basis) VALUES (?, ?, ?)",
  );
  const insMetricsTx = db.transaction(() => {
    for (const key of allKeys) {
      const m = displayMetaFor(key, metaMap);
      insMetric.run(key, m.title, m.normalizationBasis);
    }
  });
  insMetricsTx();

  const insCorr = db.prepare(`
    INSERT INTO correlations
      (metric_key_x, metric_key_y, pearson_r,
       partial_r_population, partial_r_area, partial_r_aging, partial_r_density,
       scatter_data_json)
    VALUES (@keyX, @keyY, @pearsonR, @prPop, @prArea, @prAging, @prDensity, @scatter)
  `);
  const insCorrTx = db.transaction(() => {
    for (const c of candidates) {
      insCorr.run({
        keyX: c.keyX,
        keyY: c.keyY,
        pearsonR: c.pearsonR,
        prPop: c.partialRPopulation,
        prArea: c.partialRArea,
        prAging: c.partialRAging,
        prDensity: c.partialRDensity,
        scatter: JSON.stringify(c.scatter),
      });
    }
  });
  insCorrTx();

  return db;
}

interface TopPairRow {
  rankingKeyX: string;
  rankingKeyY: string;
  pearsonR: number;
  effectiveR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  titleX: string | null;
  titleY: string | null;
  normalizationBasisX: string | null;
  normalizationBasisY: string | null;
}

/** 旧 list-top-correlations.ts の SQL を SQLite 生クエリで厳密再現。 */
function queryTopPairs(db: DatabaseConstructor.Database, limit: number): TopCorrelation[] {
  const effectiveAbsR = `MIN(
    COALESCE(ABS(c.partial_r_population), ABS(c.pearson_r)),
    COALESCE(ABS(c.partial_r_area), ABS(c.pearson_r)),
    COALESCE(ABS(c.partial_r_aging), ABS(c.pearson_r)),
    COALESCE(ABS(c.partial_r_density), ABS(c.pearson_r))
  )`;
  const rows = db
    .prepare(
      `
      SELECT
        c.metric_key_x AS rankingKeyX,
        c.metric_key_y AS rankingKeyY,
        c.pearson_r AS pearsonR,
        (CASE WHEN c.pearson_r >= 0 THEN 1 ELSE -1 END) * ${effectiveAbsR} AS effectiveR,
        c.partial_r_population AS partialRPopulation,
        c.partial_r_area AS partialRArea,
        c.partial_r_aging AS partialRAging,
        c.partial_r_density AS partialRDensity,
        ix.title AS titleX,
        iy.title AS titleY,
        ix.normalization_basis AS normalizationBasisX,
        iy.normalization_basis AS normalizationBasisY
      FROM correlations c
      INNER JOIN metrics ix ON c.metric_key_x = ix.key
      INNER JOIN metrics iy ON c.metric_key_y = iy.key
      WHERE ABS(c.pearson_r) < 0.99
      ORDER BY ${effectiveAbsR} DESC
      LIMIT ?
    `,
    )
    .all(limit * 10) as TopPairRow[];

  // 旧 repo と同様、JS 側で除外キー/除外ペアを再フィルタしてから slice。
  return rows
    .filter(
      (r) =>
        !isExcludedCorrelationKey(r.rankingKeyX) &&
        !isExcludedCorrelationKey(r.rankingKeyY) &&
        !isExcludedCorrelationPair(r.rankingKeyX, r.rankingKeyY),
    )
    .slice(0, limit)
    .map((r) => ({
      rankingKeyX: r.rankingKeyX,
      rankingKeyY: r.rankingKeyY,
      titleX: r.titleX,
      titleY: r.titleY,
      normalizationBasisX: r.normalizationBasisX,
      normalizationBasisY: r.normalizationBasisY,
      pearsonR: r.pearsonR,
      effectiveR: r.effectiveR,
      partialRPopulation: r.partialRPopulation,
      partialRArea: r.partialRArea,
      partialRAging: r.partialRAging,
      partialRDensity: r.partialRDensity,
    }));
}

interface ByKeyRawRow {
  rankingKeyX: string;
  rankingKeyY: string;
  pearsonR: number;
  partialRPopulation: number | null;
  partialRArea: number | null;
  partialRAging: number | null;
  partialRDensity: number | null;
  scatterData: string;
}

/**
 * 旧 find-highly-correlated.ts を SQLite で再現。
 * 対象 key を含むペアを ABS(pearson_r) DESC で取り、counterpart で dedup → limit。
 * scatter は X=自身になるよう必要なら x/y を swap。title/subtitle/unit を join。
 */
function queryByKey(
  db: DatabaseConstructor.Database,
  rankingKey: string,
  limit: number,
  metaMap: Map<string, MetricDisplayMeta>,
): CorrelatedItem[] {
  const FETCH_MULTIPLIER = 3;
  const rawRows = db
    .prepare(
      `
      SELECT
        metric_key_x AS rankingKeyX,
        metric_key_y AS rankingKeyY,
        pearson_r AS pearsonR,
        partial_r_population AS partialRPopulation,
        partial_r_area AS partialRArea,
        partial_r_aging AS partialRAging,
        partial_r_density AS partialRDensity,
        scatter_data_json AS scatterData
      FROM correlations
      WHERE metric_key_x = ? OR metric_key_y = ?
      ORDER BY ABS(pearson_r) DESC
      LIMIT ?
    `,
    )
    .all(rankingKey, rankingKey, limit * FETCH_MULTIPLIER) as ByKeyRawRow[];

  const seen = new Set<string>();
  const rows = rawRows
    .filter((row) => {
      const counterpart = row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX;
      if (seen.has(counterpart)) return false;
      seen.add(counterpart);
      return true;
    })
    .slice(0, limit);

  const results: CorrelatedItem[] = [];
  for (const row of rows) {
    const counterpartKey = row.rankingKeyX === rankingKey ? row.rankingKeyY : row.rankingKeyX;
    const meta = displayMetaFor(counterpartKey, metaMap);
    if (meta.title === null) continue;

    let scatter: CorrelatedItem["scatterData"];
    try {
      const parsed = JSON.parse(row.scatterData) as CorrelatedItem["scatterData"];
      scatter =
        row.rankingKeyX === rankingKey
          ? parsed
          : parsed.map((p) => ({ areaCode: p.areaCode, areaName: p.areaName, x: p.y, y: p.x }));
    } catch {
      scatter = [];
    }

    results.push({
      rankingKey: counterpartKey,
      title: meta.title,
      subtitle: meta.subtitle,
      unit: meta.unit,
      pearsonR: row.pearsonR,
      partialRPopulation: row.partialRPopulation,
      partialRArea: row.partialRArea,
      partialRAging: row.partialRAging,
      partialRDensity: row.partialRDensity,
      scatterData: scatter,
    });
  }
  return results;
}

// ─── main ─────────────────────────────────────────────────────────────────────

interface Args {
  dryRun: boolean;
  limitMetrics: number;
}

function parseArgs(argv: string[]): Args {
  const dryRun = argv.includes("--dry-run");
  const idx = argv.indexOf("--limit-metrics");
  const limitMetrics = idx >= 0 && argv[idx + 1] ? Number(argv[idx + 1]) || 0 : 0;
  return { dryRun, limitMetrics };
}

export async function buildCorrelationSnapshot(opts: { dryRun?: boolean; limitMetrics?: number } = {}): Promise<{
  topPairs: number;
  total: number;
  strong: number;
  perKeyFiles: number;
  consideredMetrics: number;
  durationMs: number;
}> {
  const startedAt = Date.now();
  assertR2WriteAllowed({ op: "correlation snapshot push", dryRun: opts.dryRun });

  // 1. 対象 metric: isActive !== false かつ prefecture entity かつ latestYear あり、
  //    かつ相関ランキング除外キーでない (旧 run-batch と同じ絞り込み)。
  let configs = listAllMetrics().filter((m) => {
    if (m.isActive === false) return false;
    if (!m.entities.includes("prefecture")) return false;
    if (!getMetricMeta(m.key)?.latestYear?.yearCode) return false;
    if (isExcludedCorrelationKey(m.key)) return false;
    return true;
  });
  if (opts.limitMetrics && opts.limitMetrics > 0) {
    configs = configs.slice(0, opts.limitMetrics);
  }

  // 制御変数は除外キーに含まれるものもあるため、別途ロード対象に加える。
  const cvConfigs = CONTROL_VARIABLES.map((cv) => getMetricConfig(cv.key)).filter(
    (c): c is MetricConfig => Boolean(c),
  );
  const loadTargets = new Map<string, MetricConfig>();
  for (const c of configs) loadTargets.set(c.key, c);
  for (const c of cvConfigs) if (!loadTargets.has(c.key)) loadTargets.set(c.key, c);

  // 2. R2 から観測値ロード (並列度制限)。
  const loaded = await loadMetricsBounded([...loadTargets.values()], FETCH_CONCURRENCY);
  const metaMap = await loadDisplayMeta();

  // 相関ペアを張る対象 (除外キー除く・観測値ありの) キー一覧。
  const pairKeys = configs.map((c) => c.key).filter((k) => loaded.has(k));
  console.log(
    `[correlation] 対象 metric=${configs.length} / 観測値あり=${pairKeys.length} / 制御変数=${
      cvConfigs.filter((c) => loaded.has(c.key)).length
    }/${CONTROL_VARIABLES.length}`,
  );

  const getCv = makeCvCorrelationGetter(loaded);

  // 3. ペア走査 (i<j)。per-key top-20 と global top-200 候補のみ JS で保持し bound。
  const perKeyTop = new Map<string, TopByAbsPearson>();
  for (const k of pairKeys) perKeyTop.set(k, new TopByAbsPearson(CORRELATION_BY_KEY_LIMIT));
  const globalTop = new GlobalTopByEffective(CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT);

  let total = 0;
  let strong = 0;
  let trivialSkipped = 0;

  for (let i = 0; i < pairKeys.length; i++) {
    const keyX = pairKeys[i];
    const mx = loaded.get(keyX)!;
    const titleX = displayMetaFor(keyX, metaMap).title;
    for (let j = i + 1; j < pairKeys.length; j++) {
      const keyY = pairKeys[j];
      const titleY = displayMetaFor(keyY, metaMap).title;
      if (isTrivialPair(keyX, keyY, titleX, titleY)) {
        trivialSkipped++;
        continue;
      }
      const my = loaded.get(keyY)!;
      const scatter = buildScatterData(mx.rows, my.rows);
      if (scatter.length < MIN_DATA_POINTS) continue;

      const { r } = calculatePearsonR(
        scatter.map((p) => p.x),
        scatter.map((p) => p.y),
      );

      // 偏相関 4 種。
      let prPop: number | null = null;
      let prArea: number | null = null;
      let prAging: number | null = null;
      let prDensity: number | null = null;
      for (const cv of CONTROL_VARIABLES) {
        const rXZ = getCv(keyX, cv.key);
        const rYZ = getCv(keyY, cv.key);
        if (rXZ === null || rYZ === null) continue;
        const pr = calculatePartialR(r, rXZ, rYZ);
        switch (cv.column) {
          case "partialRPopulation": prPop = pr; break;
          case "partialRArea": prArea = pr; break;
          case "partialRAging": prAging = pr; break;
          case "partialRDensity": prDensity = pr; break;
        }
      }

      total++;
      if (Math.abs(r) >= 0.7) strong++; // 旧 stats SQL: SUM(CASE WHEN ABS(pearsonR) >= 0.7 ...)

      const cand: CandidatePair = {
        keyX,
        keyY,
        pearsonR: r,
        partialRPopulation: prPop,
        partialRArea: prArea,
        partialRAging: prAging,
        partialRDensity: prDensity,
        scatter,
        effectiveAbsR: 0,
      };
      cand.effectiveAbsR = effectiveAbsROf(cand);

      perKeyTop.get(keyX)!.add(cand);
      perKeyTop.get(keyY)!.add(cand);
      globalTop.add(cand);
    }
  }

  console.log(
    `[correlation] ペア total=${total} strong(|r|>=0.7)=${strong} 自明除外=${trivialSkipped}`,
  );

  // 4. 候補集合 (per-key top union ∪ global top) のみ :memory: に INSERT。
  const candidateSet = new Map<string, CandidatePair>();
  const addCandidate = (c: CandidatePair) => {
    const k = c.keyX < c.keyY ? `${c.keyX}\0${c.keyY}` : `${c.keyY}\0${c.keyX}`;
    if (!candidateSet.has(k)) candidateSet.set(k, c);
  };
  for (const top of perKeyTop.values()) for (const c of top.values()) addCandidate(c);
  for (const c of globalTop.values()) addCandidate(c);
  const candidates = [...candidateSet.values()];

  const allKeys = new Set<string>(pairKeys);
  const db = buildMemoryDb(candidates, metaMap, allKeys);

  // 5. 旧 exporter SQL で top-pairs / per-key を生成。stats は走行中カウントを使う
  //    (候補集合は top-N のみで total/strong を正しく反映できないため JS 集計が正)。
  const generatedAt = new Date().toISOString();

  const topPairsSnapshot: CorrelationTopPairsSnapshot = {
    generatedAt,
    pairs: queryTopPairs(db, CORRELATION_TOP_PAIRS_SNAPSHOT_LIMIT),
  };
  const statsSnapshot: CorrelationStatsSnapshot = { generatedAt, total, strong };

  // 6. R2 書き込み (.local/r2)。
  let perKeyFiles = 0;
  if (!opts.dryRun) {
    await saveToR2(CORRELATION_TOP_PAIRS_KEY, JSON.stringify(topPairsSnapshot), {
      contentType: "application/json; charset=utf-8",
    });
    await saveToR2(CORRELATION_STATS_KEY, JSON.stringify(statsSnapshot), {
      contentType: "application/json; charset=utf-8",
    });

    for (const key of pairKeys) {
      const snapshot: CorrelationByKeySnapshot = {
        generatedAt,
        rankingKey: key,
        pairs: queryByKey(db, key, CORRELATION_BY_KEY_LIMIT, metaMap),
      };
      await saveToR2(correlationByKeyPath(key), JSON.stringify(snapshot), {
        contentType: "application/json; charset=utf-8",
      });
      perKeyFiles++;
    }
  } else {
    perKeyFiles = pairKeys.length;
  }

  db.close();
  const durationMs = Date.now() - startedAt;
  return {
    topPairs: topPairsSnapshot.pairs.length,
    total,
    strong,
    perKeyFiles,
    consideredMetrics: pairKeys.length,
    durationMs,
  };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  console.log(
    `correlation snapshot を生成します${args.dryRun ? " (dry-run)" : ""}${
      args.limitMetrics ? ` (limit-metrics=${args.limitMetrics})` : ""
    }…`,
  );
  const result = await buildCorrelationSnapshot(args);
  console.log(
    `✅ correlation: top-pairs=${result.topPairs} total=${result.total} strong=${result.strong} ` +
      `per-key=${result.perKeyFiles} metrics=${result.consideredMetrics} ${result.durationMs}ms`,
  );
}

// 直接実行時のみ main を走らせる (import 時は副作用なし)。
if (process.argv[1] && process.argv[1].includes("build-correlation-snapshot")) {
  main().catch((err) => {
    console.error("Fatal:", err);
    process.exit(1);
  });
}
