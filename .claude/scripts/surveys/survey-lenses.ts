/**
 * 統計調査の切り口台帳 (data/surveys/lenses/<surveyId>.json) を検査し、切り口 × チャネルの展開状況を出す。
 *
 *   npm run surveys:lenses:check                       # 台帳・資料の問い・分析単位の整合 (問題があれば exit 1)
 *   npm run surveys:lenses:status -- [--survey kakei-chousa] [--json]
 *
 * 状況は展開記録 (data/source-inventory/expansion.json) と各チャネルの正本から集計し、台帳には書かない。
 * 判定の本体は .claude/scripts/lib/survey-lenses.mjs。規約: .claude/rules/survey-content-standards.md「調査の切り口台帳」
 */
import fs from "node:fs";
import path from "node:path";

import { KAKEI_ANALYSES } from "@stats47/data-configs";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";
import { assertDatasetShape } from "../lib/dataset-shape.mjs";
import { checkLensLedgers, lensStatus, type LensLedger } from "../lib/survey-lenses.mjs";
import { expansionStatus, loadAnalyses, loadChannelIndex, loadExpansion } from "../source-vault/lib/reference-expansion.mjs";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");
const SURVEY_MASTER = "packages/ranking/src/data/surveys.json";
/** 表の実在を確かめられる調査の台帳 (statsDataId の一覧を持つもの) */
const TABLE_LEDGERS: Record<string, string> = { "kakei-chousa": "estat.kakei-ledger" };

const readJson = <T>(file: string): T => JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, file), "utf8")) as T;
const option = (name: string): string | null => {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] ?? null : null;
};

function loadLedgers(): LensLedger[] {
  const dir = path.join(PROJECT_ROOT, datasetDir("surveys.lenses"));
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".json"))
    .sort()
    .map((f) => {
      const doc = readJson<LensLedger>(path.join(datasetDir("surveys.lenses"), f));
      assertDatasetShape("surveys.lenses", doc);
      if (`${doc.surveyId}.json` !== f) throw new Error(`${f}: surveyId (${doc.surveyId}) とファイル名が違う`);
      return doc;
    });
}

function inputs() {
  const ledgers = loadLedgers();
  const knownSurveyIds = new Set(readJson<{ id: string }[]>(SURVEY_MASTER).map((s) => s.id));
  const tablesBySurvey = new Map<string, Set<string>>();
  for (const [surveyId, id] of Object.entries(TABLE_LEDGERS)) {
    const ledger = readJson<{ tables: { statsDataId: string }[] }>(datasetPath(id));
    tablesBySurvey.set(surveyId, new Set(ledger.tables.map((t) => t.statsDataId)));
  }
  const analyses = loadAnalyses(PROJECT_ROOT);
  const units = KAKEI_ANALYSES.map((a) => ({ id: a.id, lensId: a.lensId }));
  return { ledgers, knownSurveyIds, tablesBySurvey, analyses, units };
}

function check(): void {
  const { ledgers, knownSurveyIds, tablesBySurvey, analyses, units } = inputs();
  const findings = checkLensLedgers({ ledgers, knownSurveyIds, tablesBySurvey, analyses, units });
  for (const f of findings) console.log(`${f.level === "error" ? "✗" : "⚠"} [${f.code}] ${f.message}`);
  const errors = findings.filter((f) => f.level === "error").length;
  const lensCount = ledgers.reduce((n, l) => n + l.lenses.length, 0);
  if (errors) {
    console.error(`❌ 調査の切り口台帳: error ${errors} 件`);
    process.exit(1);
  }
  console.log(`✓ 調査の切り口台帳: ${ledgers.length} 調査・切り口 ${lensCount} 件。問い ${analyses.filter((a) => a.lensIds?.length).length} 件・分析単位 ${units.length} 件の参照が一致`);
}

function status(): void {
  const { ledgers, analyses, units } = inputs();
  const rows = expansionStatus(analyses, loadExpansion(PROJECT_ROOT), loadChannelIndex(PROJECT_ROOT));
  const survey = option("--survey");
  const result = lensStatus({ ledgers: ledgers.filter((l) => !survey || l.surveyId === survey), analyses, units, rows });
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify(result, null, 1));
    return;
  }
  for (const lens of result) {
    const blocked = lens.readiness === "blocked" ? ` [blocked: ${lens.blockers.join(" / ")}]` : "";
    console.log(`\n■ ${lens.lensId} ${lens.name} — 問い ${lens.questions} / 分析単位 ${lens.units}${blocked}`);
    for (const c of lens.channels) {
      const n = c.counts;
      console.log(`  ${c.channel.padEnd(9)} 済み ${n.done + n.derived} / 企画中 ${n.planned} / 見送り ${n.declined} / 未着手 ${n.pending} — ${c.role}`);
    }
  }
}

const sub = process.argv[2];
if (sub === "check") check();
else if (sub === "status") status();
else {
  console.error("使い方: survey-lenses.ts <check|status> [--survey id] [--json]");
  process.exit(1);
}
