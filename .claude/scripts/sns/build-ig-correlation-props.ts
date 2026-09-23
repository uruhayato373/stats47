#!/usr/bin/env tsx
/**
 * build-ig-correlation-props.ts — Instagram「相関」カルーセル用の props JSON をデータ層だけで
 * 決定的に生成する (Remotion コンポーネントはこのスキルの担当外・別途選定される)。
 *
 * 2 つのサブコマンド:
 *   --list-candidates [--limit 30] [--min-r 0.6]
 *     3 つの候補源 (優先度順: blog > by-key > top-pairs) を統合し、正直な (タウトロジーでなく、
 *     category が異なり、0.5<=|rPopulationAdjusted|<0.95 の) 候補ペアを一覧する。生成はしない。
 *   --x <key> --y <key> [--hook "<問いかけ>"] [--out <path>]
 *     指定した2指標の最新年を都道府県で突合し、Pearson r・総人口を制御した偏相関・
 *     47点の散布図データ・出典を含む props JSON を書き出す。
 *
 * フェイルクローズ条件 (非ゼロ終了・ファイル書き込みなし):
 *   - 47都道府県そろわない (n ≠ 47)
 *   - タウトロジー判定 (evaluateTautology) に該当する
 *   - 両指標の最新年が5年以上離れている
 *   - 両指標の category が同一 (2026-09-23 追加)
 *   - 総人口を制御した偏相関 |rPopulationAdjusted| が 0.5 未満、または 0.95 以上
 *     (弱すぎる関係、または category が違っても定義がほぼ同じ関係を除く。2026-09-23 に 0.4 単独下限から強化)
 *
 * データ源 (list-candidates の優先度順):
 *   a. 公開ブログの相関記事 — app/blog/all.json の published slug で "-vs-" を含むもの。
 *      両側が実在する ranking key に解決できれば候補化し、blogUrl を props に持たせる
 *   b. per-metric 相関 snapshot — packages/correlation の by-ranking-key snapshot
 *      (apps/web/src/config/indexable-ranking-keys.ts の先頭 120 key まで) の populationAdjustedR を直接使う
 *   c. app/correlation/top-pairs.json (最終フォールバック)
 *   - 観測値・出典: app/ranking/<key>/{item.json,values.json} (R2 公開 URL・認証不要)
 *   - 表示名・出典 displayName/url・category: packages/data-configs (git TS SSOT。getMetricConfig)
 *   - 相関計算: packages/correlation/src/utils/calculate-pearson.ts を import (再実装しない)
 *
 * 正典: .claude/rules/evidence-based-judgment.md (因果を示唆しない表現)、sns-content-standards.md §2-3c
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-ig-correlation-props.ts --list-candidates --limit 20 --min-r 0.6
 *   npx tsx .claude/scripts/sns/build-ig-correlation-props.ts --x <rankingKey> --y <rankingKey> [--out <path>]
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

import { getMetricConfig } from "@stats47/data-configs";
import type { MetricConfig } from "@stats47/data-configs";

import { INDEXABLE_RANKING_KEYS } from "../../../apps/web/src/config/indexable-ranking-keys.ts";
import {
  calculatePartialR,
  calculatePearsonR,
  calculatePopulationAdjustedR,
} from "../../../packages/correlation/src/utils/calculate-pearson.ts";
import {
  correlationByKeyPath,
  type CorrelationByKeySnapshot,
} from "../../../packages/correlation/src/types/snapshot.ts";
import {
  buildCautionLine,
  buildHook,
  computeFittedLineHighlights,
  evaluateCategoryRangeGate,
  evaluateTautology,
  formatR,
  joinByPrefecture,
  MAX_POPULATION_ADJUSTED_R,
  MIN_POPULATION_ADJUSTED_R,
  REQUIRED_PREFECTURE_COUNT,
  yearGapExceedsLimit,
  type JoinableValue,
  type JoinRow,
} from "./lib/correlation-carousel-core.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const PUBLIC_URL = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const TOTAL_POPULATION_KEY = "total-population";
/** by-key correlation snapshot を読みに行く指標数の上限 (ネットワーク fetch を抑える)。 */
const BY_KEY_SOURCE_LIMIT = 120;

// ─── CLI ────────────────────────────────────────────────────────────────────

function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  const has = (n: string) => a.includes(n);
  return {
    listCandidates: has("--list-candidates"),
    limit: val("--limit") ? Number(val("--limit")) : 30,
    minR: val("--min-r") ? Number(val("--min-r")) : 0.6,
    x: val("--x"),
    y: val("--y"),
    out: val("--out"),
    // 機械生成の問いかけは「割合が多い」のように不自然になりうるので、人が書いた文で上書きできる
    hook: val("--hook"),
  };
}

// ─── R2 fetch ───────────────────────────────────────────────────────────────

/** 必須 fetch。失敗したら exit(1) (これから作る出力の前提が壊れているため)。 */
async function fetchJson<T>(path: string): Promise<T> {
  const url = `${PUBLIC_URL}/${path}`;
  const res = await fetch(url);
  if (!res.ok) {
    console.error(`✗ fetch failed: ${url} (${res.status})`);
    process.exit(1);
  }
  return (await res.json()) as T;
}

/** 候補収集用の任意 fetch。存在しない/壊れている1件のために全体を止めない。 */
async function fetchJsonOrNull<T>(path: string): Promise<T | null> {
  try {
    const res = await fetch(`${PUBLIC_URL}/${path}`);
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

interface TopCorrelationPair {
  rankingKeyX: string;
  rankingKeyY: string;
  titleX: string | null;
  titleY: string | null;
  normalizationBasisX: string | null;
  normalizationBasisY: string | null;
  pearsonR: number;
  effectiveR: number;
  partialRPopulation: number | null;
}

interface TopPairsSnapshot {
  generatedAt: string;
  pairs: TopCorrelationPair[];
}

interface RankingItemPayload {
  rankingKey: string;
  title: string;
  unit: string;
  latestYear: { yearCode: string; yearName: string };
  description?: string | null;
  subtitle?: string | null;
  note?: string | null;
}

interface RankingItemSnapshot {
  generatedAt: string;
  item: RankingItemPayload;
}

interface RankingValueRow {
  metricKey: string;
  areaType: string;
  areaCode: string;
  areaName: string;
  yearCode: string;
  yearName: string;
  value: number | null;
  unit?: string;
  rank: number;
}

interface RankingValuesPartition {
  yearCode: string;
  count: number;
  values: RankingValueRow[];
}

interface RankingValuesSnapshot {
  generatedAt: string;
  rankingKey: string;
  areaType: string;
  partitions: RankingValuesPartition[];
}

interface BlogArticleSummary {
  slug: string;
  published: boolean;
}

interface BlogAllSnapshot {
  articles: BlogArticleSummary[];
}

// ─── 共通ヘルパー ───────────────────────────────────────────────────────────

/** `{kind:'external', fetcherKey:'calculated'}` を「他指標からの算術導出」の目印として扱う。 */
function isCalculatedSource(config: MetricConfig | undefined): boolean {
  const source = config?.source;
  return !!source && source.kind === "external" && source.fetcherKey === "calculated";
}

function toJoinable(rows: RankingValueRow[]): JoinableValue[] {
  return rows.map((r) => ({ areaCode: r.areaCode, areaName: r.areaName, value: r.value }));
}

function findPartition(snapshot: RankingValuesSnapshot, yearCode: string): RankingValuesPartition | undefined {
  return snapshot.partitions.find((p) => p.yearCode === yearCode);
}

/** 家計調査など、都道府県全体ではなく県庁所在市の値である指標に注記を付ける。 */
function scopeNoteFor(config: MetricConfig | undefined): string | undefined {
  const text = [config?.description, config?.subtitle, config?.note].filter(Boolean).join(" ");
  // 表記ゆれ: 大半 (722/724) は「県庁所在市」だが、家計調査系の一部は「県庁所在都市」表記
  // (例: actual-income-worker-households-per-month の note)。両方を拾う。
  return text.includes("県庁所在市") || text.includes("県庁所在都市")
    ? "値は県庁所在市（都道府県全体ではない）"
    : undefined;
}

function sourceDisplayName(config: MetricConfig | undefined): string {
  if (!config) return "不明";
  // CalculatedSource (kind:'calculated') は displayName を持たない (他指標からの算出値のため)。
  const displayName = "displayName" in config.source ? config.source.displayName : undefined;
  return displayName ?? config.category ?? "不明";
}

function pairKey(a: string, b: string): string {
  return a < b ? `${a}|${b}` : `${b}|${a}`;
}

function tautologyVerdictFor(xKey: string, yKey: string, titleX: string, titleY: string) {
  const configX = getMetricConfig(xKey);
  const configY = getMetricConfig(yKey);
  return evaluateTautology({
    keyX: xKey,
    keyY: yKey,
    titleX,
    titleY,
    unitX: configX?.unit ?? null,
    unitY: configY?.unit ?? null,
    normalizationBasisX: null,
    normalizationBasisY: null,
    isCalculatedX: isCalculatedSource(configX),
    isCalculatedY: isCalculatedSource(configY),
  });
}

// ─── 総人口 (制御変数) キャッシュ ───────────────────────────────────────────

let populationCache: Promise<Map<string, number>> | null = null;

async function loadPopulationByArea(): Promise<Map<string, number>> {
  if (populationCache) return populationCache;
  populationCache = (async () => {
    const [popItem, popValues] = await Promise.all([
      fetchJson<RankingItemSnapshot>(`app/ranking/${TOTAL_POPULATION_KEY}/item.json`),
      fetchJson<RankingValuesSnapshot>(`app/ranking/${TOTAL_POPULATION_KEY}/values.json`),
    ]);
    const popYear = popItem.item.latestYear.yearCode;
    const popPartition = findPartition(popValues, popYear);
    if (!popPartition) {
      console.error(`✗ 総人口の最新年partitionが見つかりません (${popYear})`);
      process.exit(1);
    }
    const map = new Map<string, number>();
    for (const v of popPartition.values) {
      if (v.value !== null && Number.isFinite(v.value)) map.set(v.areaCode, v.value);
    }
    return map;
  })();
  return populationCache;
}

// ─── 2指標の実相関計算 (list-candidates の blog 由来候補 と build props で共用) ─

type LiveCorrelationFailure =
  | "missing-config"
  | "missing-item"
  | "year-gap"
  | "missing-partition"
  | "not-47"
  | "missing-population";

interface LiveCorrelationValue {
  pearsonR: number;
  rPopulationAdjusted: number;
  yearX: string;
  yearY: string;
  points: JoinRow[];
  itemX: RankingItemSnapshot;
  itemY: RankingItemSnapshot;
}

type LiveCorrelationResult =
  | { ok: true; value: LiveCorrelationValue }
  | { ok: false; reason: LiveCorrelationFailure };

async function computeLiveCorrelation(xKey: string, yKey: string): Promise<LiveCorrelationResult> {
  const configX = getMetricConfig(xKey);
  const configY = getMetricConfig(yKey);
  if (!configX || !configY) return { ok: false, reason: "missing-config" };

  const [itemX, itemY, valuesX, valuesY] = await Promise.all([
    fetchJsonOrNull<RankingItemSnapshot>(`app/ranking/${xKey}/item.json`),
    fetchJsonOrNull<RankingItemSnapshot>(`app/ranking/${yKey}/item.json`),
    fetchJsonOrNull<RankingValuesSnapshot>(`app/ranking/${xKey}/values.json`),
    fetchJsonOrNull<RankingValuesSnapshot>(`app/ranking/${yKey}/values.json`),
  ]);
  if (!itemX || !itemY || !valuesX || !valuesY) return { ok: false, reason: "missing-item" };

  const yearX = itemX.item.latestYear.yearCode;
  const yearY = itemY.item.latestYear.yearCode;
  if (yearGapExceedsLimit(yearX, yearY)) return { ok: false, reason: "year-gap" };

  const partitionX = findPartition(valuesX, yearX);
  const partitionY = findPartition(valuesY, yearY);
  if (!partitionX || !partitionY) return { ok: false, reason: "missing-partition" };

  const joined = joinByPrefecture(toJoinable(partitionX.values), toJoinable(partitionY.values));
  if (joined.length !== REQUIRED_PREFECTURE_COUNT) return { ok: false, reason: "not-47" };

  const xs = joined.map((r) => r.x);
  const ys = joined.map((r) => r.y);
  const { r: pearsonR } = calculatePearsonR(xs, ys);

  const popByArea = await loadPopulationByArea();
  const popForJoined = joined.map((row) => popByArea.get(row.areaCode) ?? null);
  if (popForJoined.some((v) => v === null || !Number.isFinite(v))) {
    return { ok: false, reason: "missing-population" };
  }
  const popAligned = popForJoined as number[];
  const { r: rXPop } = calculatePearsonR(xs, popAligned);
  const { r: rYPop } = calculatePearsonR(ys, popAligned);
  const partialRPopulation = calculatePartialR(pearsonR, rXPop, rYPop);
  const rPopulationAdjusted = calculatePopulationAdjustedR({ pearsonR, partialRPopulation });

  return { ok: true, value: { pearsonR, rPopulationAdjusted, yearX, yearY, points: joined, itemX, itemY } };
}

// ─── 候補モデル + 3 ソースの収集 (優先度: blog > by-key > top-pairs) ─────────

type CandidateSource = "blog" | "by-key" | "top-pairs";

interface Candidate {
  keyX: string;
  keyY: string;
  titleX: string;
  titleY: string;
  categoryX: string;
  categoryY: string;
  pearsonR: number;
  rPopulationAdjusted: number;
  source: CandidateSource;
  blogSlug?: string;
}

/** app/blog/all.json の "-vs-" slug から (keyX,keyY) を復元し、実測 r を計算する。 */
async function gatherBlogCandidates(): Promise<Candidate[]> {
  const all = await fetchJsonOrNull<BlogAllSnapshot>("app/blog/all.json");
  if (!all) return [];

  const out: Candidate[] = [];
  for (const article of all.articles) {
    if (!article.published) continue;
    const idx = article.slug.indexOf("-vs-");
    if (idx < 0) continue;
    const leftKey = article.slug.slice(0, idx);
    const rightKey = article.slug.slice(idx + "-vs-".length);
    const configL = getMetricConfig(leftKey);
    const configR = getMetricConfig(rightKey);
    // slug が "<地域名>-vs-<地域名>" 等 ranking key ではない記事 (例: aging-rate-akita-vs-okinawa) は
    // getMetricConfig が undefined を返すのでここで弾かれる。安価な事前フィルタなので先に category も見る。
    if (!configL || !configR || configL.category === configR.category) continue;

    const live = await computeLiveCorrelation(leftKey, rightKey);
    if (!live.ok) continue;

    out.push({
      keyX: leftKey,
      keyY: rightKey,
      titleX: configL.title,
      titleY: configR.title,
      categoryX: configL.category,
      categoryY: configR.category,
      pearsonR: live.value.pearsonR,
      rPopulationAdjusted: live.value.rPopulationAdjusted,
      source: "blog",
      blogSlug: article.slug,
    });
  }
  return out;
}

/** per-metric 相関 snapshot (populationAdjustedR は事前計算済みなので追加の join 計算をしない)。 */
async function gatherByKeyCandidates(limitKeys = BY_KEY_SOURCE_LIMIT): Promise<Candidate[]> {
  const keys = [...INDEXABLE_RANKING_KEYS].slice(0, limitKeys);
  const out: Candidate[] = [];
  for (const key of keys) {
    const configK = getMetricConfig(key);
    if (!configK) continue;
    const snapshot = await fetchJsonOrNull<CorrelationByKeySnapshot>(correlationByKeyPath(key));
    if (!snapshot) continue;
    for (const item of snapshot.pairs) {
      const configOther = getMetricConfig(item.rankingKey);
      if (!configOther || configK.category === configOther.category) continue;
      out.push({
        keyX: key,
        keyY: item.rankingKey,
        titleX: configK.title,
        titleY: configOther.title ?? item.title,
        categoryX: configK.category,
        categoryY: configOther.category,
        pearsonR: item.pearsonR,
        rPopulationAdjusted: item.populationAdjustedR,
        source: "by-key",
      });
    }
  }
  return out;
}

/** 最終フォールバック。top-pairs.json は追加 fetch なしで populationAdjustedR を導出できる。 */
function gatherTopPairsCandidates(snapshot: TopPairsSnapshot): Candidate[] {
  const out: Candidate[] = [];
  for (const p of snapshot.pairs) {
    const configX = getMetricConfig(p.rankingKeyX);
    const configY = getMetricConfig(p.rankingKeyY);
    if (!configX || !configY || configX.category === configY.category) continue;
    out.push({
      keyX: p.rankingKeyX,
      keyY: p.rankingKeyY,
      titleX: p.titleX ?? configX.title,
      titleY: p.titleY ?? configY.title,
      categoryX: configX.category,
      categoryY: configY.category,
      pearsonR: p.pearsonR,
      rPopulationAdjusted: calculatePopulationAdjustedR({
        pearsonR: p.pearsonR,
        partialRPopulation: p.partialRPopulation,
      }),
      source: "top-pairs",
    });
  }
  return out;
}

async function gatherAllCandidates(): Promise<Candidate[]> {
  const [blogCandidates, byKeyCandidates, topPairsSnapshot] = await Promise.all([
    gatherBlogCandidates(),
    gatherByKeyCandidates(),
    fetchJson<TopPairsSnapshot>("app/correlation/top-pairs.json"),
  ]);
  const topPairsCandidates = gatherTopPairsCandidates(topPairsSnapshot);

  // 優先度: blog > by-key > top-pairs。同じペアが複数ソースにあれば高優先度のタグ・blogUrl を残す。
  const merged = new Map<string, Candidate>();
  for (const c of blogCandidates) merged.set(pairKey(c.keyX, c.keyY), c);
  for (const c of byKeyCandidates) {
    const k = pairKey(c.keyX, c.keyY);
    if (!merged.has(k)) merged.set(k, c);
  }
  for (const c of topPairsCandidates) {
    const k = pairKey(c.keyX, c.keyY);
    if (!merged.has(k)) merged.set(k, c);
  }
  return [...merged.values()];
}

// ─── list-candidates ────────────────────────────────────────────────────────

async function listCandidates(limit: number, minR: number): Promise<void> {
  const all = await gatherAllCandidates();
  const effectiveMinR = Math.max(minR, MIN_POPULATION_ADJUSTED_R);

  const honest = all
    .filter((c) => {
      const range = evaluateCategoryRangeGate({
        categoryX: c.categoryX,
        categoryY: c.categoryY,
        rPopulationAdjusted: c.rPopulationAdjusted,
      });
      if (!range.ok) return false;
      if (Math.abs(c.rPopulationAdjusted) < effectiveMinR) return false;
      return !tautologyVerdictFor(c.keyX, c.keyY, c.titleX, c.titleY).tautological;
    })
    .sort((a, b) => Math.abs(b.rPopulationAdjusted) - Math.abs(a.rPopulationAdjusted))
    .slice(0, limit);

  console.log(
    `候補 (優先度 blog>by-key>top-pairs / category違い必須 / ${MIN_POPULATION_ADJUSTED_R}<=|rPop|<${MAX_POPULATION_ADJUSTED_R} / タウトロジー除外 上位${limit})`
  );
  console.log("source | titleX (keyX, categoryX) x titleY (keyY, categoryY) | r | rPopulationAdjusted");
  for (const c of honest) {
    const tag = c.source === "blog" && c.blogSlug ? `blog[${c.blogSlug}]` : c.source;
    console.log(
      `${tag} | ${c.titleX} (${c.keyX}, ${c.categoryX}) x ${c.titleY} (${c.keyY}, ${c.categoryY}) | ${formatR(c.pearsonR)} | ${formatR(c.rPopulationAdjusted)}`
    );
  }
  if (honest.length === 0) {
    console.log("(該当なし)");
  }
}

// ─── build props ────────────────────────────────────────────────────────────

/** all.json の published slug から、この2指標を扱う相関記事があれば URL を返す。 */
async function findBlogUrlForPair(xKey: string, yKey: string): Promise<string | undefined> {
  const all = await fetchJsonOrNull<BlogAllSnapshot>("app/blog/all.json");
  if (!all) return undefined;
  const candidates = new Set([`${xKey}-vs-${yKey}`, `${yKey}-vs-${xKey}`]);
  const hit = all.articles.find((a) => a.published && candidates.has(a.slug));
  return hit ? `https://stats47.jp/blog/${hit.slug}` : undefined;
}

async function buildProps(
  xKey: string,
  yKey: string,
  outArg: string | null,
  hookOverride?: string | null
): Promise<void> {
  const provenance: string[] = [
    `${PUBLIC_URL}/app/ranking/${xKey}/item.json`,
    `${PUBLIC_URL}/app/ranking/${yKey}/item.json`,
    `${PUBLIC_URL}/app/ranking/${xKey}/values.json`,
    `${PUBLIC_URL}/app/ranking/${yKey}/values.json`,
    `${PUBLIC_URL}/app/ranking/${TOTAL_POPULATION_KEY}/item.json`,
    `${PUBLIC_URL}/app/ranking/${TOTAL_POPULATION_KEY}/values.json`,
  ];

  const configX = getMetricConfig(xKey);
  const configY = getMetricConfig(yKey);
  if (!configX || !configY) {
    console.error(`✗ metric config が見つかりません: ${!configX ? xKey : yKey}`);
    process.exit(1);
  }

  // 1. category gate (2026-09-23 追加: 同一 category は同じ経済圏の言い換えになりやすい)
  if (configX.category === configY.category) {
    console.error(`✗ category が同一です (${configX.category})。ファイルは書き込みません。`);
    process.exit(1);
  }

  // 2. タウトロジー gate (raw unit 判定には metric config の unit を使う。snapshot 側に無い項目のため)
  const verdict = tautologyVerdictFor(xKey, yKey, configX.title, configY.title);
  if (verdict.tautological) {
    console.error(`✗ 自明な相関ペアと判定しました (reason=${verdict.reason})。ファイルは書き込みません。`);
    process.exit(1);
  }

  const live = await computeLiveCorrelation(xKey, yKey);
  if (!live.ok) {
    console.error(`✗ 相関を計算できません (reason=${live.reason})。ファイルは書き込みません。`);
    process.exit(1);
  }
  const { pearsonR, rPopulationAdjusted, yearX, yearY, points, itemX, itemY } = live.value;

  // 3. category+人口調整後r の帯 gate (0.5<=|r|<0.95)
  const range = evaluateCategoryRangeGate({
    categoryX: configX.category,
    categoryY: configY.category,
    rPopulationAdjusted,
  });
  if (!range.ok) {
    console.error(
      `✗ category/人口調整後rの帯を満たしません (reason=${range.reason}, rPopulationAdjusted=${formatR(rPopulationAdjusted)})。ファイルは書き込みません。`
    );
    process.exit(1);
  }

  const highlights = computeFittedLineHighlights(points);
  const hook = hookOverride ?? buildHook(itemX.item.title, itemY.item.title, pearsonR);
  const caution = buildCautionLine(rPopulationAdjusted);
  const blogUrl = await findBlogUrlForPair(xKey, yKey);

  const props = {
    generatedAt: new Date().toISOString(),
    x: {
      key: xKey,
      label: itemX.item.title,
      unit: itemX.item.unit,
      year: yearX,
      source: sourceDisplayName(configX),
      category: configX.category,
      scopeNote: scopeNoteFor(configX),
    },
    y: {
      key: yKey,
      label: itemY.item.title,
      unit: itemY.item.unit,
      year: yearY,
      source: sourceDisplayName(configY),
      category: configY.category,
      scopeNote: scopeNoteFor(configY),
    },
    points: points.map((row) => ({ prefCode: row.areaCode, name: row.name, x: row.x, y: row.y })),
    r: pearsonR,
    rPopulationAdjusted,
    n: points.length,
    highlights,
    hook,
    caution,
    blogUrl,
    canonicalUrl: {
      x: `https://stats47.jp/ranking/${xKey}`,
      y: `https://stats47.jp/ranking/${yKey}`,
    },
    provenance,
  };

  const outPath =
    outArg ?? join(PROJECT_ROOT, `.local/r2/sns/correlation-carousel/${xKey}--${yKey}/instagram/props.json`);
  mkdirSync(dirname(outPath), { recursive: true });
  writeFileSync(outPath, `${JSON.stringify(props, null, 2)}\n`);
  console.log(`✓ wrote ${outPath}`);
  console.log(
    `  r=${formatR(pearsonR)} / rPopulationAdjusted=${formatR(rPopulationAdjusted)} / n=${points.length} / blogUrl=${blogUrl ?? "なし"}`
  );
}

// ─── entry ──────────────────────────────────────────────────────────────────

async function main() {
  const args = parseArgs();
  if (args.listCandidates) {
    await listCandidates(args.limit, args.minR);
    return;
  }
  if (args.x && args.y) {
    await buildProps(args.x, args.y, args.out, args.hook);
    return;
  }
  console.error("Usage: --list-candidates [--limit N] [--min-r R]  |  --x <key> --y <key> [--hook <text>] [--out <path>]");
  process.exit(1);
}

main().catch((err) => {
  console.error(`✗ ${err instanceof Error ? err.message : String(err)}`);
  process.exit(1);
});
