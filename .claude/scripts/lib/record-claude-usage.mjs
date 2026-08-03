#!/usr/bin/env node
/**
 * Claude Code routine 1 run 分のトークン実績を CSV に 1 行 append する。
 *
 * ★なぜ要るか (2026-08-03)
 * 日次件数を ai-content 1→5 / blog 1→3 に引き上げたが、**「1 件あたり何トークンか」を
 * 一度も測っていない**まま「利用枠が律速だから 5 にした」と言っている状態だった。
 * execution log には usage が最初から書かれていて、診断ステップも既にそのファイルを
 * 読んでいる。捨てていただけなので、1 行の履歴として残す。
 *
 * ★何を測れて何を測れないか (混同しない)
 *   測れる   … run ごとの in / out / cache_write / cache_read と、1 件あたりの換算
 *   測れない … Pro / Max の利用枠を何 % 使ったか。total_cost_usd は「API なら幾らか」の
 *              換算値であって実請求ではない。枠の残りは枠に当たったエラーからしか分からない。
 *
 * 追記専用。既存行は書き換えない。同じ run_id が既にあれば何もしない (再実行で二重化しない)。
 */

import { appendFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

import { summarizeClaudeExecution } from './summarize-claude-execution.mjs';

export const CSV_HEADER =
  'date,workflow,run_id,limit,items,turns,duration_ms,cost_usd,input,output,cache_write,cache_read,token_source,is_error';

/** CSV に落とす前の 1 行。値は全て単純な数値か短い識別子で、自由文を入れない。 */
export function buildUsageRow({ summary, date, workflow, runId, limit, items }) {
  const t = summary.tokens;
  return {
    date,
    workflow,
    run_id: String(runId ?? ''),
    limit: Number(limit ?? 0),
    items: Number(items ?? 0),
    turns: summary.numTurns ?? '',
    duration_ms: summary.durationMs ?? '',
    cost_usd: summary.totalCostUsd ?? '',
    input: t.input,
    output: t.output,
    cache_write: t.cacheWrite,
    cache_read: t.cacheRead,
    // 未取得を 0 と読み違えないよう source を残す (none = 記録が無かった)
    token_source: t.source ?? 'none',
    is_error: summary.isError ? 1 : 0,
  };
}

export function formatCsvLine(row) {
  return CSV_HEADER.split(',')
    .map((key) => {
      const v = row[key];
      const s = v === null || v === undefined ? '' : String(v);
      // 自由文は入れない設計だが、万一混ざっても CSV を壊さない
      return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
    })
    .join(',');
}

/** 同じ run_id が既にあるか。再実行や resume で二重計上しないため。 */
export function hasRunId(csvText, runId) {
  if (!runId) return false;
  const idx = CSV_HEADER.split(',').indexOf('run_id');
  return csvText
    .split('\n')
    .slice(1)
    .some((line) => line.split(',')[idx] === String(runId));
}

export function appendUsageRow(file, row) {
  mkdirSync(dirname(file), { recursive: true });
  if (!existsSync(file)) writeFileSync(file, `${CSV_HEADER}\n`);
  const text = readFileSync(file, 'utf8');
  if (hasRunId(text, row.run_id)) return { appended: false, reason: 'duplicate-run-id' };
  appendFileSync(file, `${formatCsvLine(row)}\n`);
  return { appended: true };
}

function arg(name, fallback = '') {
  const i = process.argv.indexOf(name);
  return i !== -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const execFile = process.argv[2];
  const out = arg('--out', '.claude/state/metrics/claude-usage/history.csv');
  if (!execFile) {
    console.error('usage: record-claude-usage.mjs <execution-log.json> --workflow <name> ...');
    process.exit(2);
  }
  let parsed;
  try {
    parsed = JSON.parse(readFileSync(execFile, 'utf8'));
  } catch (error) {
    // 計測は本体の成否を左右しない。読めなければ黙って諦める (0 を捏造しない)
    console.log(`execution log を読めないので記録しない: ${error instanceof Error ? error.message : error}`);
    process.exit(0);
  }
  const summary = summarizeClaudeExecution(parsed);
  const row = buildUsageRow({
    summary,
    date: arg('--date', new Date().toISOString().slice(0, 10)),
    workflow: arg('--workflow', 'unknown'),
    runId: arg('--run-id'),
    limit: arg('--limit', '0'),
    items: arg('--items', '0'),
  });
  const res = appendUsageRow(out, row);
  console.log(res.appended ? `記録: ${formatCsvLine(row)}` : `記録しない (${res.reason}): run ${row.run_id}`);
  if (row.token_source === 'none') {
    console.log('::warning::execution log に usage が無かった。token 列は 0 だが未取得を意味する');
  }
}
