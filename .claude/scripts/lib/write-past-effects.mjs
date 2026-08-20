#!/usr/bin/env node
/**
 * write-past-effects.mjs — `effect/none` / `effect/adverse` の台帳 writer。
 *
 * 「同じことをもう一度提案する」を止めるための抑制台帳を、バックログの effect ラベルから
 * 機械的に生成する。read 側は既に 2 箇所にあるのに writer が存在せず、台帳が空のままだった
 * (候補 736 件に confidence 抑制が一切かかっていなかった) のを閉じる。
 *
 * 台帳 (2 つ):
 *   1. `.claude/state/search-growth/past-effects.json` … `.urls` (key = pathKey or `<type>::<pathKey>`)
 *      → `.claude/scripts/search-growth/lib/scoring.mjs` が confidence を ×0.6 / ×0.3 する
 *   2. `.claude/state/metrics/adsense/past-effects.json` … `.candidates` (key = `<rule>::<key>`)
 *      → `.claude/scripts/metrics/lib/adsense-diagnostics.mjs` が同様に抑制する
 *
 * key の抽出は**決定的**で、推測しない:
 *   - search-growth: 行タイトル中の `/blog/...` 等のサイト内 path、`<type>::/path` 形式、
 *     および `BLOG-WAVE-<wave_id>` ID から auto-brushup-history 経由で解決した記事 slug
 *   - adsense: 行タイトル中の `<既知 rule>::<key>` トークン
 *   どちらにも解決できない行は `unmapped` として報告する (no silent drop)。
 *
 * Usage:
 *   node .claude/scripts/lib/write-past-effects.mjs                # 2 台帳を更新
 *   node .claude/scripts/lib/write-past-effects.mjs --dry-run      # 差分だけ表示
 *   node .claude/scripts/lib/write-past-effects.mjs --backlog <path> --search-growth-out <p> --adsense-out <p>
 *
 * 注: バックログの effect/none|adverse は現在 0 件。writer は「閾値エンジンが none/adverse を
 * 出した瞬間に生きる経路」として先に作る (0 件でも正常終了する)。
 * 正典: `.claude/rules/evidence-based-judgment.md` / `.claude/agents/improvement-triage.md`
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { parseBacklog } from "./scan-pending-improvements.mjs";
import { toPathKey } from "../search-growth/lib/join-url.mjs";
import { writeJson, readJson } from "../search-growth/lib/state.mjs";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

const SEARCH_GROWTH_LEDGER = path.join(PROJECT_ROOT, ".claude/state/search-growth/past-effects.json");
const ADSENSE_LEDGER = path.join(PROJECT_ROOT, ".claude/state/metrics/adsense/past-effects.json");
const BRUSHUP_HISTORY = path.join(PROJECT_ROOT, ".claude/state/blog/auto-brushup-history.json");

/** サイト内 path として認識する第 1 セグメント (url-policy の実在ルートに限る)。 */
const SITE_ROOTS = [
  "blog",
  "ranking",
  "areas",
  "category",
  "themes",
  "survey",
  "tag",
  "compare",
  "correlation",
];

/** search-growth candidate type の接頭辞 (`<type>::<pathKey>` 形式で限定するとき)。 */
const SEARCH_GROWTH_TYPES = [
  "ctr-opportunity",
  "striking-distance",
  "query-gap",
  "intent-mismatch",
  "mobile-gap",
  "indexability-conflict",
  "crawled-not-indexed",
  "soft-404-risk",
  "canonical-drift",
  "cwv-opportunity",
  "lab-regression",
  "server-risk",
  "measurement-gap",
];

/** adsense candidate rule (`<rule>::<key>`)。正典は adsense-diagnostics.mjs の各 detector。 */
const ADSENSE_RULES = [
  "impression-dilution",
  "device-regression",
  "placement-low-viewability",
  "format-low-yield",
  "measurement-gap",
  "traffic-mix-shift",
];

/** status → 台帳 value。 */
export function effectValueOf(status) {
  if (status === "effect/none") return "none";
  if (status === "effect/adverse") return "adverse";
  return null;
}

/** wave_id → 記事 slug 一覧 (auto-brushup-history)。 */
export function loadWaveSlugs(historyPath = BRUSHUP_HISTORY) {
  const map = new Map();
  const history = readJson(historyPath, null);
  for (const e of history?.entries ?? []) {
    if (!e.wave_id || !e.slug) continue;
    if (!map.has(e.wave_id)) map.set(e.wave_id, new Set());
    map.get(e.wave_id).add(e.slug);
  }
  return map;
}

/**
 * バックログ 1 行から search-growth 台帳のキーを抽出する。
 * @param {{section_id:string, title:string}} entry
 * @param {Map<string, Set<string>>} waveSlugs
 * @returns {string[]}
 */
export function searchGrowthKeysOf(entry, waveSlugs = new Map()) {
  const keys = new Set();
  const text = `${entry.section_id} ${entry.title}`;

  // 1. `<type>::/path` 形式 (candidate type を限定する場合)
  const typeAlt = SEARCH_GROWTH_TYPES.join("|");
  for (const m of text.matchAll(new RegExp(`\\b(${typeAlt})::(/[\\w%\\-./]+)`, "g"))) {
    const p = toPathKey(m[2]);
    if (p) keys.add(`${m[1]}::${p}`);
  }

  // 2. 素のサイト内 path
  const rootAlt = SITE_ROOTS.join("|");
  for (const m of text.matchAll(new RegExp(`/(?:${rootAlt})(?:/[\\w%\\-.]+)*`, "g"))) {
    const p = toPathKey(m[0]);
    if (p && p !== "/") keys.add(p);
  }

  // 3. BLOG-WAVE-<wave_id> → 履歴から slug を解決
  const wave = entry.section_id.match(/^BLOG-WAVE-(.+)$/i);
  if (wave) {
    const slugs = waveSlugs.get(wave[1]) ?? waveSlugs.get(wave[1].toLowerCase());
    for (const slug of slugs ?? []) {
      const p = toPathKey(`/blog/${slug}`);
      if (p) keys.add(p);
    }
  }

  return [...keys].sort();
}

/** バックログ 1 行から adsense 台帳のキー (`<rule>::<key>`) を抽出する。 */
export function adsenseKeysOf(entry) {
  const keys = new Set();
  const text = `${entry.section_id} ${entry.title}`;
  const ruleAlt = ADSENSE_RULES.join("|");
  for (const m of text.matchAll(new RegExp(`\\b(${ruleAlt})::([^\\s\`、。,]+)`, "g"))) {
    keys.add(`${m[1]}::${m[2]}`);
  }
  return [...keys].sort();
}

/**
 * バックログ entries から 2 台帳の内容を組み立てる (純粋関数)。
 * @param {object[]} entries parseBacklog の戻り値
 * @param {Map<string, Set<string>>} waveSlugs
 */
export function buildLedgers(entries, waveSlugs = new Map()) {
  const urls = {};
  const candidates = {};
  const mapped = [];
  const unmapped = [];

  for (const e of entries) {
    const value = effectValueOf(e.status);
    if (!value) continue;
    const sgKeys = searchGrowthKeysOf(e, waveSlugs);
    const adKeys = e.metric === "adsense" ? adsenseKeysOf(e) : [];
    if (sgKeys.length === 0 && adKeys.length === 0) {
      unmapped.push({ id: e.section_id, status: e.status, metric: e.metric });
      continue;
    }
    for (const k of sgKeys) urls[k] = worse(urls[k], value);
    for (const k of adKeys) candidates[k] = worse(candidates[k], value);
    mapped.push({ id: e.section_id, value, searchGrowth: sgKeys, adsense: adKeys });
  }

  return {
    urls: sortObject(urls),
    candidates: sortObject(candidates),
    mapped,
    unmapped,
  };
}

/** 同じ key に none と adverse が来たら悪い方 (adverse) を残す。 */
function worse(current, next) {
  if (current === "adverse" || next === "adverse") return "adverse";
  return next ?? current;
}

function sortObject(o) {
  return Object.fromEntries(Object.entries(o).sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0)));
}

const SG_NOTE =
  'candidate の confidence を抑制する過去施策の effect/none・effect/adverse 台帳。' +
  'improvement-triage が .claude/todo/improvements.md の effect/none|adverse エントリから維持する。' +
  'key は URL の pathKey (例 /blog/<slug>) または `<type>::<pathKey>`。value は "none" | "adverse"。';
const AD_NOTE =
  'AdSense candidate の confidence を抑制する過去施策の effect/none・effect/adverse 台帳。' +
  'key は adsense-diagnostics の candidate id `<rule>::<key>` (例 device-regression::Desktop)。' +
  'value は "none" | "adverse"。';
const LEDGER_SOURCE = ".claude/todo/improvements.md の effect ラベル (writer: .claude/scripts/lib/write-past-effects.mjs)";

function main() {
  const args = process.argv.slice(2);
  const getArg = (flag, fallback = null) => {
    const i = args.indexOf(flag);
    return i >= 0 && args[i + 1] ? args[i + 1] : fallback;
  };
  const dryRun = args.includes("--dry-run");
  const backlogPath = getArg("--backlog", process.env.IMPROVEMENT_BACKLOG_PATH || undefined);
  const sgOut = getArg("--search-growth-out", SEARCH_GROWTH_LEDGER);
  const adOut = getArg("--adsense-out", ADSENSE_LEDGER);
  const historyPath = getArg("--history", BRUSHUP_HISTORY);

  const entries = backlogPath ? parseBacklog(backlogPath) : parseBacklog();
  // scan-pending-improvements の既定 status filter は CLI 側の話なので、ここは全行を見る
  const waveSlugs = loadWaveSlugs(historyPath);
  const built = buildLedgers(entries, waveSlugs);

  const sgPrev = readJson(sgOut, null);
  const adPrev = readJson(adOut, null);
  const sgNext = {
    note: sgPrev?.note ?? SG_NOTE,
    source: sgPrev?.source ?? LEDGER_SOURCE,
    urls: built.urls,
  };
  const adNext = {
    note: adPrev?.note ?? AD_NOTE,
    source: adPrev?.source ?? LEDGER_SOURCE,
    candidates: built.candidates,
  };

  const out = [];
  out.push("# past-effects 台帳 writer (effect/none|adverse → candidate 抑制)");
  out.push(`# backlog: ${backlogPath ?? ".claude/todo/improvements.md"} / entries: ${entries.length}`);
  out.push("");
  out.push(`search-growth: ${Object.keys(built.urls).length} key (prev ${Object.keys(sgPrev?.urls ?? {}).length})`);
  for (const [k, v] of Object.entries(built.urls)) out.push(`  ${v.padEnd(7)} ${k}`);
  out.push(`adsense: ${Object.keys(built.candidates).length} key (prev ${Object.keys(adPrev?.candidates ?? {}).length})`);
  for (const [k, v] of Object.entries(built.candidates)) out.push(`  ${v.padEnd(7)} ${k}`);
  if (built.mapped.length === 0) {
    out.push("");
    out.push("effect/none|adverse の行は 0 件 (抑制対象なし)。閾値エンジンが確定した時点で埋まる。");
  }
  if (built.unmapped.length > 0) {
    out.push("");
    out.push("## key を解決できなかった行 (no silent drop — triage が対象を明示する)");
    for (const u of built.unmapped) out.push(`- ${u.id} [${u.status}] metric=${u.metric}`);
  }
  process.stdout.write(out.join("\n") + "\n");

  if (dryRun) {
    process.stderr.write("\n[dry-run] 台帳は書き込んでいない\n");
    return;
  }
  writeJson(sgOut, sgNext);
  writeJson(adOut, adNext);
  process.stderr.write(`\n✓ wrote ${sgOut}\n✓ wrote ${adOut}\n`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  main();
}
