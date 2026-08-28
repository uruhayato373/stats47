/**
 * アフィリエイト運用 集約状態 (.claude/state/ads/affiliate-operations-latest.json) の生成 CLI。
 *
 * 入力 (すべて既存 snapshot / SSOT。ネットワーク不要):
 *   - .claude/state/ads/inventory-latest.json   (audit-affiliate-inventory.ts)
 *   - .claude/state/ads/ga4-affiliate-*.json    (fetch-affiliate-ga4.cjs、最新日付を自動選択)
 *   - .claude/state/ads/compliance-latest.json  (audit-affiliate-compliance.ts --live)
 *   - .claude/state/ads/experiments.json        (実験 registry、/manage-affiliate-experiment が書く)
 *   - apps/web/scripts/affiliate-ads-data.ts    (experimentId 付きエントリ = variant 実体)
 *
 * 判定 (freshness / 計測ゲート / 実験 status / 推奨アクション) はすべて
 * lib/affiliate-operations-core.mjs の純粋関数で決定的に行う。モデルに判断させない。
 * 鍵や dimension が無ければ measurementGate=blocked として失敗を隠さない。
 *
 * 実行:
 *   npx tsx .claude/scripts/ads/build-affiliate-operations-state.ts           # 生成 + validate
 *   npx tsx .claude/scripts/ads/build-affiliate-operations-state.ts --check   # 既存 state の validate のみ
 *   npx tsx .claude/scripts/ads/build-affiliate-operations-state.ts --json    # JSON を stdout に出力
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";
import {
  aggregateVariantMetrics,
  buildOperationsState,
  evaluateExperiments,
  evaluateMeasurementGate,
  validateOperationsState,
} from "./lib/affiliate-operations-core.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = resolve(__dirname, "../../..");
const STATE_DIR = resolve(PROJECT_ROOT, ".claude/state/ads");
const OUT_PATH = resolve(STATE_DIR, "affiliate-operations-latest.json");

function readJsonIfExists(path: string): any | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8"));
}

/** ga4-affiliate-YYYY-MM-DD.json のうち最新日付のものを選ぶ (ファイル名で決定的に)。 */
function latestGa4Snapshot(): { data: any; relPath: string } | null {
  const names = readdirSync(STATE_DIR)
    .filter((n) => /^ga4-affiliate-\d{4}-\d{2}-\d{2}\.json$/.test(n))
    .sort();
  const name = names.at(-1);
  if (!name) return null;
  return {
    data: readJsonIfExists(resolve(STATE_DIR, name)),
    relPath: `.claude/state/ads/${name}`,
  };
}

function main(): void {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const jsonOnly = args.includes("--json");

  if (checkOnly) {
    const existing = readJsonIfExists(OUT_PATH);
    if (!existing) {
      process.stderr.write(`[error] ${OUT_PATH} が無い (先に生成する)\n`);
      process.exit(1);
    }
    const errors = validateOperationsState(existing);
    if (errors.length > 0) {
      process.stderr.write(`[error] operations state validate 失敗:\n- ${errors.join("\n- ")}\n`);
      process.exit(1);
    }
    process.stdout.write("✅ affiliate-operations-latest.json validate OK\n");
    return;
  }

  const nowIso = new Date().toISOString();
  const inventory = readJsonIfExists(resolve(STATE_DIR, "inventory-latest.json"));
  const ga4 = latestGa4Snapshot();
  const compliance = readJsonIfExists(resolve(STATE_DIR, "compliance-latest.json"));
  const registry = readJsonIfExists(resolve(STATE_DIR, "experiments.json"))?.experiments ?? [];
  const portfolio = readJsonIfExists(resolve(STATE_DIR, "affiliate-portfolio-latest.json"));

  const hasActiveExperiments = registry.some((e: { status?: string }) => e.status !== "closed");
  const measurementGate = evaluateMeasurementGate({
    ga4: ga4?.data ?? null,
    inventory,
    nowIso,
    hasActiveExperiments,
  });
  const variantMetrics = aggregateVariantMetrics(
    ga4?.data?.experiments ?? [],
  );
  const experiments = evaluateExperiments({
    registry,
    ads: AFFILIATE_ADS,
    variantMetrics,
    nowIso,
    measurementGate,
  });

  const state = buildOperationsState({
    nowIso,
    inventory,
    inventoryPath: inventory ? ".claude/state/ads/inventory-latest.json" : null,
    ga4: ga4?.data ?? null,
    ga4Path: ga4?.relPath ?? null,
    compliance,
    experiments,
    measurementGate,
    portfolio: portfolio ? { ...portfolio, snapshotPath: ".claude/state/ads/affiliate-portfolio-latest.json" } : null,
  });

  const errors = validateOperationsState(state);
  if (errors.length > 0) {
    process.stderr.write(`[error] 生成した state が validate 失敗 (バグ):\n- ${errors.join("\n- ")}\n`);
    process.exit(1);
  }

  writeFileSync(OUT_PATH, JSON.stringify(state, null, 2));

  if (jsonOnly) {
    process.stdout.write(JSON.stringify(state, null, 2) + "\n");
    return;
  }

  const lines: string[] = [];
  lines.push(`# アフィリエイト運用 集約状態 (${nowIso.slice(0, 10)})`);
  lines.push("");
  lines.push(`- measurementGate: **${state.measurementGate.status}**` +
    (state.measurementGate.reasons.length ? ` (${state.measurementGate.reasons.join(", ")})` : ""));
  lines.push(`- publishGate: **${state.publishGate.status}**` +
    (state.publishGate.reasons.length ? ` (${state.publishGate.reasons.join(", ")})` : ""));
  lines.push(`- portfolioGate: **${state.portfolioGate.status}**` +
    (state.portfolioGate.reasons.length ? ` (${state.portfolioGate.reasons.join(", ")})` : ""));
  lines.push(`- freshness: inventory ${state.freshness.inventoryDays ?? "?"}d / ga4 ${state.freshness.ga4Days ?? "?"}d`);
  lines.push(`- coverage: gap=[${state.coverage.gapVerticals.join(", ")}] thin=[${state.coverage.thinVerticals.join(", ")}]`);
  lines.push(`- directPlacements: total ${state.directPlacements.total} / orphaned ${state.directPlacements.orphaned.length} / missingDisclosure ${state.directPlacements.missingDisclosure.length}`);
  lines.push(`- experiments: active ${state.experiments.active.length} / readyToDecide ${state.experiments.readyToDecide.length} / invalid ${state.experiments.invalid.length} / inconclusive ${state.experiments.inconclusive.length}`);
  lines.push("");
  if (state.recommendedActions.length) {
    lines.push("## recommendedActions (決定的生成)");
    lines.push("");
    lines.push("| id | reason | command |");
    lines.push("|---|---|---|");
    for (const a of state.recommendedActions) lines.push(`| ${a.id} | ${a.reason} | \`${a.command}\` |`);
  } else {
    lines.push("✅ 推奨アクションなし (すべて正常)");
  }
  process.stdout.write(lines.join("\n") + "\n");
  process.stderr.write(`\n[operations] state → ${OUT_PATH}\n`);
}

main();
