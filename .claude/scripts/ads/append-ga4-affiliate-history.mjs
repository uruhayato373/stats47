#!/usr/bin/env node
/**
 * GA4 アフィリエイト実測の生 snapshot (fetch-affiliate-ga4.cjs の出力) から、git に残す週次集約だけを
 * `data/affiliate/ga4-affiliate-history.csv` へ追記する。
 *
 *   node .claude/scripts/ads/append-ga4-affiliate-history.mjs data/affiliate/ga4-affiliate-2026-09-14.json
 *
 * 行 = periodEnd(date) × affiliate_vertical × link_position (overview / 旧 rows を合算)
 * + `_all,_all` の合計行。同じ periodEnd の行は置き換える (再実行で二重計上しない)。
 * `days` と `date` から集計期間を再構成できる。過去期間の backfill も日付順に整列する。
 * 生 snapshot 本体は CI が R2 `state/ads/ga4-affiliate/` へ push し、ローカルは `npm run state:pull -- ads/ga4-affiliate`。
 * 効果判定 (T14d / T28d の before/after) はこの CSV で足りる。
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const HISTORY = path.join(ROOT, datasetPath("ga4.affiliate-history"));
const EXPERIMENT_HISTORY = path.join(ROOT, datasetPath("affiliate.experiment-history"));
export const HEADER = "date,days,affiliate_vertical,link_position,impressions,clicks,ctr";
export const EXPERIMENT_HEADER = "date,days,experiment_id,variant_id,impressions,clicks,ctr";

export function aggregateRows(snapshot) {
  const { date, days } = snapshot;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error(`snapshot.date が不正: ${date}`);
  const groups = new Map();
  // 2026-08-28 以降は overview、それ以前の snapshot は rows (同じ列)。
  for (const row of snapshot.overview ?? snapshot.rows ?? []) {
    const vertical = row.affiliate_vertical || "(not set)";
    const position = row.link_position || "(not set)";
    const key = `${vertical}\u0000${position}`;
    const g = groups.get(key) ?? { vertical, position, impressions: 0, clicks: 0 };
    g.impressions += Number(row.impressions) || 0;
    g.clicks += Number(row.clicks) || 0;
    groups.set(key, g);
  }
  const rows = [...groups.values()]
    .sort((a, b) => a.vertical.localeCompare(b.vertical) || a.position.localeCompare(b.position))
    .map((g) => [date, days, g.vertical, g.position, g.impressions, g.clicks, ratio(g.clicks, g.impressions)]);
  const totals = snapshot.totals ?? {};
  rows.push([date, days, "_all", "_all", Number(totals.impressions) || 0, Number(totals.clicks) || 0, ratio(totals.clicks, totals.impressions)]);
  return rows;
}

export function aggregateExperimentRows(snapshot) {
  const { date, days } = snapshot;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(date))) throw new Error(`snapshot.date が不正: ${date}`);
  const groups = new Map();
  for (const row of snapshot.experiments ?? []) {
    const experimentId = row.experiment_id;
    const variantId = row.variant_id;
    if (!experimentId || experimentId === "(unset)" || !variantId || variantId === "(unset)") continue;
    const key = `${experimentId}\u0000${variantId}`;
    const group = groups.get(key) ?? { experimentId, variantId, impressions: 0, clicks: 0 };
    group.impressions += Number(row.impressions) || 0;
    group.clicks += Number(row.clicks) || 0;
    groups.set(key, group);
  }
  return [...groups.values()]
    .sort((left, right) => left.experimentId.localeCompare(right.experimentId) || left.variantId.localeCompare(right.variantId))
    .map((group) => [
      date,
      days,
      group.experimentId,
      group.variantId,
      group.impressions,
      group.clicks,
      ratio(group.clicks, group.impressions),
    ]);
}

function ratio(clicks, impressions) {
  const c = Number(clicks) || 0, i = Number(impressions) || 0;
  return i ? (c / i).toFixed(6) : "0";
}

function csvCell(v) {
  const s = String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function mergeHistory(existingCsv, rows) {
  return mergeDatedHistory(existingCsv, rows, HEADER);
}

export function mergeExperimentHistory(existingCsv, rows, date) {
  return mergeDatedHistory(existingCsv, rows, EXPERIMENT_HEADER, date);
}

function mergeDatedHistory(existingCsv, rows, header, explicitDate = null) {
  const date = explicitDate ?? rows[0]?.[0];
  const lines = existingCsv ? existingCsv.replace(/\r\n/g, "\n").split("\n").filter(Boolean) : [];
  const body = lines.filter((l, i) => !(i === 0 && l === header)).filter((l) => !date || !l.startsWith(`${date},`));
  body.push(...rows.map((r) => r.map(csvCell).join(",")));
  body.sort((a, b) => {
    const dateOrder = a.slice(0, 10).localeCompare(b.slice(0, 10));
    return dateOrder || a.localeCompare(b);
  });
  const out = [header, ...body];
  return out.join("\n") + "\n";
}

export function appendHistory(snapshotPath, { historyPath = HISTORY, experimentHistoryPath = EXPERIMENT_HISTORY } = {}) {
  const snapshot = JSON.parse(fs.readFileSync(snapshotPath, "utf8"));
  const rows = aggregateRows(snapshot);
  const experimentRows = aggregateExperimentRows(snapshot);
  const existing = fs.existsSync(historyPath) ? fs.readFileSync(historyPath, "utf8") : "";
  const existingExperiment = fs.existsSync(experimentHistoryPath) ? fs.readFileSync(experimentHistoryPath, "utf8") : "";
  fs.mkdirSync(path.dirname(historyPath), { recursive: true });
  fs.writeFileSync(historyPath, mergeHistory(existing, rows));
  fs.writeFileSync(
    experimentHistoryPath,
    mergeExperimentHistory(existingExperiment, experimentRows, snapshot.date),
  );
  return {
    date: snapshot.date,
    rows: rows.length,
    experimentRows: experimentRows.length,
    historyPath,
    experimentHistoryPath,
  };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const file = process.argv[2];
  if (!file) {
    console.error("usage: node .claude/scripts/ads/append-ga4-affiliate-history.mjs <ga4-affiliate-YYYY-MM-DD.json>");
    process.exit(2);
  }
  const r = appendHistory(path.resolve(file));
  console.log(`[ga4-affiliate-history] ${r.date}: ${r.rows} rows → ${path.relative(ROOT, r.historyPath)}`);
  console.log(`[affiliate-experiment-history] ${r.date}: ${r.experimentRows} rows → ${path.relative(ROOT, r.experimentHistoryPath)}`);
}
