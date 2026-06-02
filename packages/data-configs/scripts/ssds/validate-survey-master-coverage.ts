/**
 * survey マスタ整合性チェック (ビルド時 lint / CI 向け)。
 *
 * Phase 5 の再分配は metric → 原典 survey id でバケットを作る。その survey id が
 * surveys.json (master) に存在しないと /survey が孤児 (all.json 不在で 404) になる。
 * 本スクリプトは「全 metric を解決して得られる非合成 survey id が、すべて master に
 * 存在するか」を検証する。1 件でも欠けると exit 1 (CI fail)。
 *
 * 実行: cd packages/data-configs && npx tsx scripts/ssds/validate-survey-master-coverage.ts
 */

import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { METRICS_REGISTRY } from "../../src/registry";
import { resolveMetricProvenance } from "../../src/provenance/resolve-metric-provenance";

const __dirname = dirname(fileURLToPath(import.meta.url));
const SURVEYS_JSON = join(__dirname, "../../../ranking/src/data/surveys.json");

function isSynthetic(id: string): boolean {
  return id.startsWith("ssds-src:") || id.startsWith("src:");
}

function main(): void {
  const master: { id: string }[] = JSON.parse(readFileSync(SURVEYS_JSON, "utf-8"));
  const masterIds = new Set(master.map((s) => s.id));

  // 解決される非合成 survey id → それを生む metric 例
  const missing = new Map<string, string>();
  let resolvedIdCount = 0;

  for (const metric of Object.values(METRICS_REGISTRY)) {
    for (const survey of resolveMetricProvenance(metric, METRICS_REGISTRY)) {
      if (isSynthetic(survey.id)) continue;
      resolvedIdCount++;
      if (!masterIds.has(survey.id) && !missing.has(survey.id)) {
        missing.set(survey.id, metric.key);
      }
    }
  }

  console.log(`master survey 件数: ${masterIds.size}`);
  console.log(`解決された非合成 survey 参照: ${resolvedIdCount}`);
  if (missing.size === 0) {
    console.log("✓ 整合性 OK — 再分配先の survey はすべて master に存在 (孤児バケットなし)");
    return;
  }
  console.error(`✗ master に存在しない survey id: ${missing.size} 件`);
  for (const [id, exampleKey] of missing) {
    console.error(`  ${id}  (例: metric=${exampleKey})`);
  }
  process.exit(1);
}

main();
