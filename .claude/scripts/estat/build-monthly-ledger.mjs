#!/usr/bin/env node
/**
 * 月次データの台帳。サイトの指標は年単位なので、月別の図や季節の話題に使える e-Stat の表をここで管理する。
 *
 *   data/estat/monthly/decisions.json  調査ごとの採否・使い道・問い (人が判断して変える正本)
 *   data/estat/monthly/ledger.json     e-Stat カタログから作る調査ごとの月次の表の数 (生成物)
 *
 * Usage:
 *   npm run estat:catalog:pull                               # カタログを .local/estat-catalog へ取る
 *   node .claude/scripts/estat/build-monthly-ledger.mjs       # ledger.json を作り直す
 *   node .claude/scripts/estat/build-monthly-ledger.mjs --check  # 判断と台帳の食い違いで止める (カタログ不要)
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetPath } from "../../../config/datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const CATALOG_DIR = path.join(ROOT, ".local/estat-catalog/index/tables");
const LEDGER = path.join(ROOT, datasetPath("estat.monthly-ledger"));
const DECISIONS = path.join(ROOT, datasetPath("estat.monthly-decisions"));
const MONTHLY = "月次";
const PREFECTURE_AREA = "2";

const readJson = (file) => JSON.parse(fs.readFileSync(file, "utf8"));

/** e-Stat カタログの行 → 調査ごとの要約。判断が指す表だけは題名ごと控える */
export function summarizeMonthlyTables(rows, pinnedIds) {
  const surveys = new Map();
  for (const row of rows) {
    if (row.cycle !== MONTHLY || row.removedAt) continue;
    const survey = surveys.get(row.statCode) ?? { statCode: row.statCode, statName: row.statName, govOrg: row.govOrg, tables: 0, prefectureTables: 0, latestUpdate: "", pinned: [] };
    survey.tables += 1;
    if ((row.collectAreas ?? []).includes(PREFECTURE_AREA)) survey.prefectureTables += 1;
    if ((row.updatedDate ?? "") > survey.latestUpdate) survey.latestUpdate = row.updatedDate;
    if (pinnedIds.has(row.statsDataId)) survey.pinned.push({ statsDataId: row.statsDataId, title: row.title, updatedDate: row.updatedDate });
    surveys.set(row.statCode, survey);
  }
  return [...surveys.values()]
    .map((survey) => ({ ...survey, pinned: survey.pinned.sort((a, b) => a.statsDataId.localeCompare(b.statsDataId)) }))
    .sort((a, b) => b.tables - a.tables || a.statCode.localeCompare(b.statCode));
}

/** 判断と台帳の食い違い。全調査に判断があり、判断が指す表は月次の表として実在する */
export function monthlyLedgerErrors(ledger, decisions) {
  const errors = [];
  const surveys = new Map(ledger.surveys.map((survey) => [survey.statCode, survey]));
  const decided = new Set(decisions.decisions.map((d) => d.statCode));
  for (const survey of ledger.surveys) if (!decided.has(survey.statCode)) errors.push(`判断の無い調査: ${survey.statCode} ${survey.statName}`);
  for (const d of decisions.decisions) {
    const survey = surveys.get(d.statCode);
    if (!survey) { errors.push(`月次の表の無い調査への判断: ${d.statCode}`); continue; }
    const pinned = new Set(survey.pinned.map((t) => t.statsDataId));
    for (const id of d.tables ?? []) if (!pinned.has(id)) errors.push(`${d.statCode}: 月次の表に無い ${id}`);
    if (d.decision === "use" && !d.tables?.length) errors.push(`${d.statCode}: 使う調査に表の指定が無い`);
  }
  return errors;
}

function main() {
  const decisions = readJson(DECISIONS);
  if (process.argv.includes("--check")) {
    const errors = monthlyLedgerErrors(readJson(LEDGER), decisions);
    for (const error of errors) console.error(`✗ ${error}`);
    if (errors.length) process.exit(1);
    console.log(`✓ 月次の台帳: ${decisions.decisions.length} 調査の判断と一致`);
    return;
  }
  if (!fs.existsSync(CATALOG_DIR)) {
    console.error("カタログがありません。npm run estat:catalog:pull を先に実行します。");
    process.exit(1);
  }
  const rows = fs.readdirSync(CATALOG_DIR).flatMap((file) => readJson(path.join(CATALOG_DIR, file)));
  const surveys = summarizeMonthlyTables(rows, new Set(decisions.decisions.flatMap((d) => d.tables ?? [])));
  const ledger = {
    schemaVersion: 1,
    summary: { catalogTables: rows.length, monthlyTables: surveys.reduce((sum, s) => sum + s.tables, 0), surveys: surveys.length },
    surveys,
  };
  fs.writeFileSync(LEDGER, `${JSON.stringify(ledger, null, 2)}\n`);
  const errors = monthlyLedgerErrors(ledger, decisions);
  for (const error of errors) console.error(`✗ ${error}`);
  console.log(`月次の表 ${ledger.summary.monthlyTables} / ${rows.length} 表・${surveys.length} 調査`);
  if (errors.length) process.exit(1);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1])) main();
