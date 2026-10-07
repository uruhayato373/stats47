/**
 * 家計調査の全 metric を、総務省の収支項目分類 (正本: data/estat/kakei-classification/<revision>.json) と突き合わせる。
 * 判定は lib/kakei-classification.mjs。read-only で、問題があれば exit 1。
 *
 *   npx tsx .claude/scripts/estat/check-kakei-classification.ts
 *   npx tsx .claude/scripts/estat/check-kakei-classification.ts --json
 *
 * 正本の作り直しは build-kakei-classification.mjs (統計局が改定を出したとき)。
 */
import fs from "node:fs";
import path from "node:path";

import { METRICS_REGISTRY } from "@stats47/data-configs/registry";

import { datasetDir } from "../../../config/datasets.mjs";
import { checkKakeiMetric } from "./lib/kakei-classification.mjs";

const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..");

/**
 * 2020年改定の品目分類を使う家計調査の表 → 品目コード表を持つ表。
 * 数量の表 (0003348235) は金額の表 (0003348239) と同じ cdCat01 を使う (2026-10-08 に かつお 010211040 等で確認)。
 */
const TABLES: Record<string, { revision: string; codeTable: string }> = {
  "0003348235": { revision: "2020", codeTable: "0003348239" },
  "0003348239": { revision: "2020", codeTable: "0003348239" },
};

interface CheckResult {
  key: string;
  item: string | null;
  findings: { code: string; message: string }[];
}

interface KakeiMetricConfig {
  key: string;
  title?: string;
  subtitle?: string;
  note?: string;
  source?: { kind?: string; filter?: { statsDataId?: string; cdCat01?: string; axisSum?: { axis: string; codes: string[] } } };
}

function readJson<T>(relative: string): T {
  return JSON.parse(fs.readFileSync(path.join(PROJECT_ROOT, relative), "utf8")) as T;
}

function cat01Names(statsDataId: string): Map<string, string> {
  const meta = readJson<{ dimensions: { id: string; sampleValues: { code: string; name: string }[] }[] }>(
    path.join(datasetDir("estat.meta"), `${statsDataId}.json`),
  );
  const cat01 = meta.dimensions.find((d) => d.id === "cat01");
  if (!cat01) throw new Error(`${statsDataId}: cat01 がメタ控えに無い`);
  return new Map(cat01.sampleValues.map((v) => [v.code, v.name]));
}

function main(): void {
  const asJson = process.argv.includes("--json");
  const results: CheckResult[] = [];
  const unknownTables = new Map<string, number>();
  for (const config of Object.values(METRICS_REGISTRY) as KakeiMetricConfig[]) {
    if (config?.source?.kind !== "kakei-chousa") continue;
    const statsDataId = config.source.filter?.statsDataId ?? "";
    const filter = config.source.filter ?? {};
    // 総数コードの無い費目は品目の合算 (axisSum) で持つ。合算する品目それぞれを検査する
    const codes = filter.cdCat01 ? [filter.cdCat01] : filter.axisSum?.axis === "cat01" ? filter.axisSum.codes : [];
    const table = TABLES[statsDataId];
    if (!table) {
      unknownTables.set(statsDataId, (unknownTables.get(statsDataId) ?? 0) + 1);
      continue;
    }
    const classification = readJson<{ items: Record<string, never> }>(
      path.join(datasetDir("estat.kakei-classification"), `${table.revision}.json`),
    );
    if (codes.length === 0) {
      results.push({ key: config.key, item: null, findings: [{ code: "NO_CAT01", message: "cdCat01 も cat01 の axisSum も無い" }] });
      continue;
    }
    for (const cdCat01 of codes) {
      results.push(checkKakeiMetric({ ...config, cdCat01 }, cat01Names(table.codeTable), classification) as CheckResult);
    }
  }
  const failing = results.filter((r) => r.findings.length > 0);
  const metricCount = new Set(results.map((r) => r.key)).size;
  const tableFindings = [...unknownTables].map(([id, count]) => ({ statsDataId: id, count }));

  if (asJson) {
    console.log(JSON.stringify({ checked: metricCount, failing, unknownTables: tableFindings }, null, 2));
  } else {
    for (const r of failing) for (const f of r.findings) console.log(`✗ [${f.code}] ${r.key}: ${f.message}`);
    for (const t of tableFindings) console.log(`✗ [UNKNOWN_TABLE] statsDataId ${t.statsDataId} (${t.count} 指標) の品目分類の改定が TABLES に無い`);
    const resolved = new Set(results.filter((r) => r.item).map((r) => r.key)).size;
    const failingMetrics = new Set(failing.map((r) => r.key)).size;
    console.log(`kakei classification: 検査 ${metricCount} 指標 / 品目に解決 ${resolved} (残りは十大費目・中分類) / 指摘 ${failingMetrics} 指標 / 未登録の表 ${tableFindings.length}`);
  }
  if (failing.length > 0 || tableFindings.length > 0) process.exit(1);
}

main();
