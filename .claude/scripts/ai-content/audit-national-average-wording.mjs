#!/usr/bin/env node
/**
 * audit-national-average-wording.mjs — 公開中の AI 解説の「全国平均」を数える dry-run (AI-CONTENT-NATIONAL-AVERAGE-WORDING-01)。
 *
 * 公開 R2 の各ランキングの ai-content.json を読み、行ごとに
 *   置換できる (replaceable) / 再生成が要る (regenerate) / 公表の全国値なので対象外 (official) を数える。
 * outbox にも R2 にも何も書かない。判定は packages/ops/src/ai-content/lib/national-average-wording.mjs。
 *
 *   node .claude/scripts/ai-content/audit-national-average-wording.mjs            # 件数と例 5 件
 *   node .claude/scripts/ai-content/audit-national-average-wording.mjs --json     # 機械可読
 *   node .claude/scripts/ai-content/audit-national-average-wording.mjs --limit 50 # 先頭 N 件だけ (動作確認)
 *
 * 置換後の行は audit-ai-content.mjs の auditRow (数値照合なし) に通し、置換前に通っていた行が置換後に落ちる件数も数える。
 */
import { auditRow } from "../../../packages/ops/src/ai-content/audit-ai-content.mjs";
import {
  applyReplacement,
  classifyRow,
  findOccurrences,
  replaceReplaceable,
  simpleMeanWording,
} from "../../../packages/ops/src/ai-content/lib/national-average-wording.mjs";
import { latestPartition } from "../../../packages/ops/src/ai-content/lib/value-health.mjs";
import { isNationalAreaCode, isPrefectureAreaCode } from "../../../packages/area/mirror/prefectures.cjs";
import { R2_PUBLIC_ORIGIN, RANKING_R2_PREFIX } from "../../../packages/r2-storage/mirror/r2-keys.mjs";

const R2 = process.env.R2_PUBLIC_FETCH_URL ?? R2_PUBLIC_ORIGIN;
const CONCURRENCY = 16;
const EXAMPLE_COUNT = 5;
const args = process.argv.slice(2);
const AS_JSON = args.includes("--json");
const limitIdx = args.indexOf("--limit");
const LIMIT = limitIdx >= 0 ? Number(args[limitIdx + 1]) : 0;

async function getJson(url) {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    return res.ok ? await res.json() : null;
  } catch {
    return null;
  }
}

async function pool(items, fn) {
  const out = new Array(items.length);
  let next = 0;
  await Promise.all(
    Array.from({ length: Math.min(CONCURRENCY, items.length) }, async () => {
      while (next < items.length) {
        const i = next++;
        out[i] = await fn(items[i]);
      }
    }),
  );
  return out;
}

/** 置換の前後が分かる 1 文 (最初に置換される 1 か所を含む文) */
function exampleSentence(text, label) {
  const i = findOccurrences(text)[0];
  const before = text.slice(0, i);
  const start = Math.max(before.lastIndexOf("。"), before.lastIndexOf("\n")) + 1;
  const endIdx = text.indexOf("。", i);
  const end = endIdx === -1 ? Math.min(text.length, i + 60) : endIdx + 1;
  const sentence = text.slice(start, end);
  return { before: sentence, after: replaceReplaceable(sentence, label).text };
}

const items = await getJson(`${R2}/${RANKING_R2_PREFIX}-items/all.json`);
let keys = (items?.items ?? []).filter((it) => it.areaType === "prefecture" && it.isActive).map((it) => it.rankingKey);
if (keys.length === 0) {
  console.error("ranking-items/all.json を読めない");
  process.exit(1);
}
if (LIMIT > 0) keys = keys.slice(0, LIMIT);

const rows = await pool(keys, async (key) => {
  const row = await getJson(`${R2}/${RANKING_R2_PREFIX}/${encodeURIComponent(key)}/ai-content.json`);
  if (!row) return { key, missing: true };
  const values = await getJson(`${R2}/${RANKING_R2_PREFIX}/${encodeURIComponent(key)}/values.json`);
  const { rows: valueRows } = values ? latestPartition(values) : { rows: [] };
  const hasPublishedNational = valueRows.some((v) => isNationalAreaCode(String(v.areaCode)) || String(v.areaCode) === "00");
  const prefectureCount = valueRows.filter((v) => isPrefectureAreaCode(String(v.areaCode))).length;
  const { verdict, counts } = classifyRow(row, { hasPublishedNational });
  const result = { key, verdict, counts, hasPublishedNational, prefectureCount, valuesMissing: !values };
  if (verdict === "replaceable" && prefectureCount > 0) {
    const label = simpleMeanWording(prefectureCount);
    const { row: next } = applyReplacement(row, label, { hasPublishedNational });
    const was = auditRow(row);
    const now = auditRow(next);
    result.auditBefore = was.ok;
    result.auditAfter = now.ok;
    const field = ["insights", "regionalAnalysis"].find((f) => typeof row[f] === "string" && findOccurrences(row[f]).length > 0);
    if (field) result.example = { field, ...exampleSentence(row[field], label) };
  }
  return result;
});

const present = rows.filter((r) => !r.missing);
const tally = { none: 0, replaceable: 0, regenerate: 0, official: 0 };
for (const r of present) tally[r.verdict] += 1;
const sum = (pick) => present.reduce((acc, r) => acc + (r.counts ? pick(r.counts) : 0), 0);
const replaceableChecked = present.filter((r) => r.verdict === "replaceable" && r.auditBefore !== undefined);
const regression = replaceableChecked.filter((r) => r.auditBefore && !r.auditAfter).map((r) => r.key);
const summary = {
  keys: keys.length,
  read: present.length,
  missing: rows.length - present.length,
  rows: tally,
  occurrences: { replaceable: sum((c) => c.replaceable), regenerate: sum((c) => c.regenerate), official: sum((c) => c.official) },
  valuesMissing: present.filter((r) => r.valuesMissing).length,
  auditChecked: replaceableChecked.length,
  auditPassedBefore: replaceableChecked.filter((r) => r.auditBefore).length,
  auditPassedAfter: replaceableChecked.filter((r) => r.auditAfter).length,
  auditRegressions: regression,
  regenerateKeys: present.filter((r) => r.verdict === "regenerate").map((r) => r.key),
  officialKeys: present.filter((r) => r.verdict === "official").map((r) => r.key),
  examples: present.filter((r) => r.example).slice(0, EXAMPLE_COUNT).map((r) => ({ key: r.key, ...r.example })),
};

if (AS_JSON) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(`ai-content ${summary.read}/${summary.keys} 件を読んだ (R2 に無い ${summary.missing}・観測値を読めない ${summary.valuesMissing})`);
  console.log(
    `行の判定: 「全国平均」なし ${tally.none} / 置換できる ${tally.replaceable} / 再生成が要る ${tally.regenerate} / 公表の全国値で対象外 ${tally.official}`,
  );
  console.log(
    `出現の数: 置換できる ${summary.occurrences.replaceable} / 再生成が要る ${summary.occurrences.regenerate} / 対象外 ${summary.occurrences.official}`,
  );
  console.log(
    `audit-ai-content (数値照合なし): 置換できる行 ${summary.auditChecked} 件のうち 置換前に通る ${summary.auditPassedBefore} → 置換後に通る ${summary.auditPassedAfter} (前は通って後に落ちる ${regression.length})`,
  );
  if (summary.regenerateKeys.length > 0) console.log(`再生成が要る key: ${summary.regenerateKeys.join(", ")}`);
  if (summary.officialKeys.length > 0) console.log(`対象外の key: ${summary.officialKeys.join(", ")}`);
  console.log("\n置換の前後の例:");
  for (const e of summary.examples) console.log(`- ${e.key} (${e.field})\n    前: ${e.before}\n    後: ${e.after}`);
}
