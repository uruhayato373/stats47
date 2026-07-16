#!/usr/bin/env tsx
/**
 * build-buzz-map-catalog.ts — バズ地図 (buzz-map) の「投稿できるネタ」候補カタログを
 * 構築/更新する状態付きキュー builder。
 *
 * blog の build-topic-queue.mjs の姉妹スクリプト。SNS 展開を計画的に回すため、
 * e-Stat 由来の metric registry (git TS = SSOT) を一次ソースに候補を棚卸し・スコアリングする。
 * e-Stat API を生で再走査しない (取り込み済み registry + R2 観測値だけで完結)。
 *
 * 2 レーン:
 *   - muni: entities に "city" を含む active metric 全量 (市区町村マップ = まちの計量舎の主戦場)
 *   - pref: 都道府県のみの active metric を機械フィルタ (二値化しやすさ×鮮度×相性×流入) で上位に絞る
 *
 * スコア (エフェメラル計算 → 状態付きキュー JSON。永続 DB は作らない):
 *   combined = 0.35*affinity + 0.25*freshness + 0.20*binaryFram + 0.20*gscImp
 *   - affinity:   category の X 相性 (x-catalog getAffinity の 反論/数字 = paradox/number 軸)
 *   - freshness:  latestYear 2022+ =1.0 / 2018+ =0.6 / それ以前 0.2
 *   - binaryFram: 二値化しやすさ (unit %系=1.0 / title に率|割合|指数|あたり=0.7 / その他 0.3)
 *   - gscImp:     最新 GSC pages.csv の /ranking/<key> imp → norm(log)。無ければ 0
 *
 * status: candidate → spec → generated → posted / rejected (再構築時に upsert 保持)
 *
 * 真実源 (SSOT): .claude/state/sns/buzz-map-catalog.json (git tracked)
 * 正典: .claude/rules/buzz-map-standards.md §4
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts                    # 構築/更新 + top20 表示
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --pref-cap 400     # pref レーンの採録上限
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --next 10 [--lane muni|pref]
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-spec <metricKey> [--theme-id <id>]
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-generated <metricKey>
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-posted <metricKey>
 *   npx tsx .claude/scripts/sns/build-buzz-map-catalog.ts --mark-rejected <metricKey> [--note "理由"]
 */

import { readFileSync, writeFileSync, mkdirSync, existsSync, readdirSync } from "node:fs";
import { dirname, join } from "node:path";

import { listAllMetrics, getMetricMeta } from "@stats47/data-configs";
import type { MetricConfig } from "@stats47/data-configs";

// x-catalog は .cjs (require)
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { getAffinity } = require("../lib/x-catalog.cjs") as {
  getAffinity: () => Record<string, Record<string, string>>;
};

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const STATE_PATH = join(PROJECT_ROOT, ".claude/state/sns/buzz-map-catalog.json");
const GSC_SNAPSHOTS = join(
  PROJECT_ROOT,
  ".claude/skills/analytics/gsc-improvement/reference/snapshots",
);

type Lane = "muni" | "pref";
type Status = "candidate" | "spec" | "generated" | "posted" | "rejected";

interface CatalogEntry {
  metricKey: string;
  lane: Lane;
  title: string;
  subtitle: string | null;
  category: string;
  unit: string;
  latestYear: string | null;
  yearCount: number;
  score: number;
  breakdown: { affinity: number; freshness: number; binaryFram: number; gscImp: number };
  status: Status;
  themeId: string | null;
  note: string | null;
}

interface CatalogFile {
  generatedAt: string | null;
  weights: Record<string, number>;
  counts: { muni: number; pref: number };
  entries: CatalogEntry[];
}

// ─── CLI ───
function parseArgs() {
  const a = process.argv.slice(2);
  const val = (n: string) => {
    const i = a.indexOf(n);
    return i !== -1 ? (a[i + 1] ?? null) : null;
  };
  return {
    prefCap: val("--pref-cap") ? Number(val("--pref-cap")) : 400,
    next: val("--next") ? Number(val("--next")) : null,
    lane: (val("--lane") as Lane | null) ?? null,
    markSpec: val("--mark-spec"),
    markGenerated: val("--mark-generated"),
    markPosted: val("--mark-posted"),
    markRejected: val("--mark-rejected"),
    markCandidate: val("--mark-candidate"),
    themeId: val("--theme-id"),
    note: val("--note"),
  };
}

// ─── スコアリング部品 ───
const RATE_RE = /率|割合|指数|あたり|当たり|per\b/i;
const PCT_UNIT_RE = /[%‰]|パーセント|ポイント/;

/** category → 反論(paradox)/数字(number) 相性を 0.3-1.0 に。◎=1.0 ○=0.6 △=0.3 —=0.1 */
function affinityScore(category: string, affinity: Record<string, Record<string, string>>): number {
  const row = affinity[category];
  if (!row) return 0.4;
  const mark = (m: string) => (m === "◎" ? 1 : m === "○" ? 0.6 : m === "△" ? 0.3 : 0.1);
  // バズ地図は「通説と逆」「数字の格差」で刺す → 反論・数字を重視
  return Math.max(mark(row["反論"] ?? ""), mark(row["数字"] ?? "") * 0.9);
}

function freshnessScore(latestYear: string | null): number {
  if (!latestYear) return 0.2;
  const y = parseInt(latestYear, 10);
  if (y >= 2022) return 1;
  if (y >= 2018) return 0.6;
  return 0.2;
}

function binaryFramingScore(config: MetricConfig): number {
  if (PCT_UNIT_RE.test(config.unit)) return 1;
  if (RATE_RE.test(config.title) || RATE_RE.test(config.unit)) return 0.7;
  return 0.3;
}

/** 最新 GSC snapshot の /ranking/<key> impressions を key→imp で返す。 */
function loadGscImpByKey(): Map<string, number> {
  const out = new Map<string, number>();
  if (!existsSync(GSC_SNAPSHOTS)) return out;
  const weeks = readdirSync(GSC_SNAPSHOTS)
    .filter((d) => /^\d{4}-W\d{2}$/.test(d))
    .sort();
  if (weeks.length === 0) return out;
  const csv = join(GSC_SNAPSHOTS, weeks[weeks.length - 1], "pages.csv");
  if (!existsSync(csv)) return out;
  const lines = readFileSync(csv, "utf8").split("\n").slice(1);
  for (const line of lines) {
    const m = line.match(/\/ranking\/([a-z0-9-]+)[^,]*,\s*\d+\s*,\s*(\d+)/);
    if (m) out.set(m[1], Math.max(out.get(m[1]) ?? 0, Number(m[2])));
  }
  return out;
}

function normLog(v: number, max: number): number {
  if (max <= 0 || v <= 0) return 0;
  return Math.log1p(v) / Math.log1p(max);
}

// ─── メイン ───
function loadState(): CatalogFile {
  if (existsSync(STATE_PATH)) {
    try {
      return JSON.parse(readFileSync(STATE_PATH, "utf8")) as CatalogFile;
    } catch {
      /* fresh */
    }
  }
  return { generatedAt: null, weights: {}, counts: { muni: 0, pref: 0 }, entries: [] };
}

function saveState(state: CatalogFile) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, JSON.stringify(state, null, 2) + "\n");
}

const WEIGHTS = { affinity: 0.35, freshness: 0.25, binaryFram: 0.2, gscImp: 0.2 };

function rebuild(prefCap: number): CatalogFile {
  const prev = loadState();
  // 既存 status を metricKey で引けるように (upsert 保持)
  const prevByKey = new Map(prev.entries.map((e) => [e.metricKey, e]));

  const affinity = getAffinity();
  const gscImp = loadGscImpByKey();
  const gscMax = Math.max(1, ...gscImp.values());

  const active = listAllMetrics().filter((c) => c.isActive !== false);

  const scoreOf = (config: MetricConfig, lane: Lane): CatalogEntry => {
    const meta = getMetricMeta(config.key);
    const b = {
      affinity: affinityScore(config.category, affinity),
      freshness: freshnessScore(meta?.latestYear?.yearCode ?? null),
      binaryFram: binaryFramingScore(config),
      gscImp: normLog(gscImp.get(config.key) ?? 0, gscMax),
    };
    const score =
      WEIGHTS.affinity * b.affinity +
      WEIGHTS.freshness * b.freshness +
      WEIGHTS.binaryFram * b.binaryFram +
      WEIGHTS.gscImp * b.gscImp;
    const prevEntry = prevByKey.get(config.key);
    return {
      metricKey: config.key,
      lane,
      title: config.title,
      subtitle: config.subtitle ?? null,
      category: config.category,
      unit: config.unit,
      latestYear: meta?.latestYear?.yearCode ?? null,
      yearCount: meta?.availableYears.length ?? 0,
      score: Math.round(score * 1000) / 1000,
      breakdown: {
        affinity: Math.round(b.affinity * 100) / 100,
        freshness: b.freshness,
        binaryFram: b.binaryFram,
        gscImp: Math.round(b.gscImp * 100) / 100,
      },
      // status/themeId/note は前回を保持 (rejected/posted を再構築で消さない)
      status: prevEntry?.status ?? "candidate",
      themeId: prevEntry?.themeId ?? null,
      note: prevEntry?.note ?? null,
    };
  };

  // muni: city 対応 active 全量
  const muni = active
    .filter((c) => c.entities.includes("city"))
    .map((c) => scoreOf(c, "muni"))
    .sort((a, b) => b.score - a.score);

  // pref: city 非対応 (都道府県のみ) を機械フィルタ → 上位 prefCap
  const prefAll = active
    .filter((c) => !c.entities.includes("city"))
    .map((c) => scoreOf(c, "pref"))
    // 二値化しにくい・古すぎるノイズを落とす
    .filter((e) => e.breakdown.binaryFram >= 0.7 && e.breakdown.freshness >= 0.6)
    .sort((a, b) => b.score - a.score);
  const pref = prefAll.slice(0, prefCap);

  const entries = [...muni, ...pref];
  const state: CatalogFile = {
    generatedAt: new Date().toISOString(),
    weights: WEIGHTS,
    counts: { muni: muni.length, pref: pref.length },
    entries,
  };
  saveState(state);
  return state;
}

function printTop(state: CatalogFile, lane: Lane, n = 20) {
  const rows = state.entries.filter((e) => e.lane === lane && e.status === "candidate").slice(0, n);
  console.log(`\n=== ${lane} レーン top${n} (status=candidate) ===`);
  console.log("score  cat                 latestY  metricKey / title");
  for (const e of rows) {
    console.log(
      `${e.score.toFixed(3)}  ${e.category.padEnd(18)} ${(e.latestYear ?? "-").padEnd(7)} ${e.metricKey}  「${e.title}」`,
    );
  }
}

function markStatus(key: string, status: Status, themeId: string | null, note: string | null) {
  const state = loadState();
  const entry = state.entries.find((e) => e.metricKey === key);
  if (!entry) {
    console.error(`✗ metricKey が見つかりません: ${key} (先に rebuild してください)`);
    process.exit(1);
  }
  entry.status = status;
  if (status === "candidate") {
    // 候補に戻す = 未着手扱い。spec 由来の紐付けをクリアして状態を正確に保つ
    entry.themeId = null;
    entry.note = null;
  }
  if (themeId) entry.themeId = themeId;
  if (note) entry.note = note;
  saveState(state);
  console.log(`✓ ${key} → status=${status}${themeId ? ` themeId=${themeId}` : ""}`);
}

function main() {
  const opts = parseArgs();

  if (opts.markCandidate) return markStatus(opts.markCandidate, "candidate", opts.themeId, opts.note);
  if (opts.markSpec) return markStatus(opts.markSpec, "spec", opts.themeId, opts.note);
  if (opts.markGenerated) return markStatus(opts.markGenerated, "generated", opts.themeId, opts.note);
  if (opts.markPosted) return markStatus(opts.markPosted, "posted", opts.themeId, opts.note);
  if (opts.markRejected) return markStatus(opts.markRejected, "rejected", opts.themeId, opts.note);

  if (opts.next != null) {
    const state = loadState();
    const lanes: Lane[] = opts.lane ? [opts.lane] : ["muni", "pref"];
    const out = state.entries
      .filter((e) => lanes.includes(e.lane) && e.status === "candidate")
      .slice(0, opts.next);
    for (const e of out) console.log(JSON.stringify(e));
    return;
  }

  const state = rebuild(opts.prefCap);
  console.log(
    `カタログ再構築: muni ${state.counts.muni} 件 / pref ${state.counts.pref} 件 (上限 ${opts.prefCap})`,
  );
  console.log(`SSOT: ${STATE_PATH}`);
  printTop(state, "muni");
  printTop(state, "pref");
}

main();
