/**
 * 社会・人口統計体系 (SSDS) の全指標の yearFormat (暦年 calendar / 年度 fiscal) を、e-Stat の定義の控えから
 * 決めた区切りと突き合わせる。判定は lib/ssds-year-format.mjs。read-only で、食い違いがあれば exit 1。
 *
 *   npx tsx .claude/scripts/estat/check-ssds-year-format.ts            食い違いを表示
 *   npx tsx .claude/scripts/estat/check-ssds-year-format.ts --json     結果を JSON で出力
 *   npx tsx .claude/scripts/estat/check-ssds-year-format.ts --explain <key>   1 指標の判定の根拠を表示
 *
 * 落ちたときの直し方:
 *   MISMATCH              指標の定義 (data/metrics/<key>.ts) の yearFormat を、表示された区切りに直す
 *   UNDETERMINED_UNLISTED 調査の年の呼び方を一次資料で確かめて decisions.json の surveyNaming に足す。
 *                         確かめられなければ理由を書いて undetermined に足す (上限 UNDETERMINED_CEILING は上げない)
 *   STALE_UNDETERMINED / UNKNOWN_KEY  decisions.json の undetermined からその行を消す
 *
 * 控えの作り直しは build-ssds-definitions.mjs (e-Stat が定義を改めたとき)。
 */
import fs from "node:fs";
import path from "node:path";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";

import { datasetPath } from "../../../config/datasets.mjs";
import { checkSsdsYearFormats, decideYearFormat, buildRules, indexDefinitions, ssdsTableKind } from "./lib/ssds-year-format.mjs";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

interface SsdsSource {
  kind?: string;
  statsDataId?: string;
  cdCat01?: string;
  axisSum?: { axis: string; codes: readonly string[] };
  axisRatio?: { axis: string; numeratorCodes: readonly string[]; denominatorCodes: readonly string[] };
}

interface SsdsMetric {
  key: string;
  statsDataId: string;
  cdCat01: string[];
  yearFormat?: string;
}

function readJson<T>(datasetId: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, datasetPath(datasetId)), "utf8")) as T;
}

/** 指標が読む cat01 の符号。1 つの符号・合算 (axisSum)・率 (axisRatio) のどれでも、全部の符号を返す */
function cat01Codes(source: SsdsSource): string[] {
  if (source.cdCat01) return [source.cdCat01];
  if (source.axisSum?.axis === "cat01") return [...source.axisSum.codes];
  if (source.axisRatio?.axis === "cat01") return [...source.axisRatio.numeratorCodes, ...source.axisRatio.denominatorCodes];
  return [];
}

function collectSsdsMetrics(): { metrics: SsdsMetric[]; noCodes: string[] } {
  const metrics: SsdsMetric[] = [];
  const noCodes: string[] = [];
  for (const config of Object.values(METRICS_REGISTRY) as { key: string; yearFormat?: string; source?: SsdsSource }[]) {
    const source = config.source;
    if (source?.kind !== "estat" || !source.statsDataId || !ssdsTableKind(source.statsDataId)) continue;
    const cdCat01 = cat01Codes(source);
    if (cdCat01.length === 0) noCodes.push(config.key);
    else metrics.push({ key: config.key, statsDataId: source.statsDataId, cdCat01, yearFormat: config.yearFormat });
  }
  return { metrics, noCodes };
}

function main(): void {
  const definitions = readJson<Parameters<typeof indexDefinitions>[0]>("estat.ssds-definitions");
  const decisions = readJson<Parameters<typeof checkSsdsYearFormats>[2]>("estat.ssds-year-format-decisions");
  const index = indexDefinitions(definitions);
  const { metrics, noCodes } = collectSsdsMetrics();

  const explainAt = process.argv.indexOf("--explain");
  if (explainAt !== -1) {
    const key = process.argv[explainAt + 1];
    const metric = metrics.find((m) => m.key === key);
    if (!metric) {
      console.error(`${key} は SSDS の指標に無い`);
      process.exit(1);
    }
    console.log(JSON.stringify({ ...metric, decision: decideYearFormat(metric, index, buildRules(decisions)) }, null, 2));
    return;
  }

  const result = checkSsdsYearFormats(metrics, index, decisions);
  const errors = [
    ...result.errors,
    ...noCodes.map((key) => ({ code: "NO_CAT01", key, message: `${key} は SSDS の表を読むが、cdCat01 も cat01 の axisSum・axisRatio も無い` })),
  ];
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ checked: result.checked, errors, undetermined: result.undetermined }, null, 2));
  } else {
    for (const error of errors) console.log(`✗ [${error.code}] ${error.message}`);
    console.log(`ssds year format: 検査 ${result.checked} 指標 / 判定できない (理由付きの一覧) ${result.undetermined.length} / 指摘 ${errors.length}`);
  }
  if (errors.length > 0) process.exit(1);
}

main();
