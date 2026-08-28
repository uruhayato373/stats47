/** 公開pilotの開始可否・必要母数・観測判定をread-only stateへ生成する。 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAffiliatePilotState,
  estimateAffiliatePilotFeasibility,
  validateAffiliatePilotState,
} from "./lib/affiliate-pilot-core.mjs";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const STATE_DIR = resolve(ROOT, ".claude/state/ads");
const OUT_PATH = resolve(STATE_DIR, "affiliate-pilot-readiness-latest.json");

function readJson(path: string): any | null {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function main(): void {
  if (process.argv.includes("--check")) {
    const state = readJson(OUT_PATH);
    const errors = state ? validateAffiliatePilotState(state) : ["state-missing"];
    if (errors.length > 0) throw new Error(errors.join("\n"));
    process.stdout.write("✅ affiliate-pilot-readiness-latest.json validate OK\n");
    return;
  }

  const portfolio = readJson(resolve(STATE_DIR, "affiliate-portfolio-latest.json"));
  const operations = readJson(resolve(STATE_DIR, "affiliate-operations-latest.json"));
  const registry = readJson(resolve(STATE_DIR, "experiments.json"));
  const activeExperiments = (registry?.experiments ?? []).filter((experiment: { status?: string }) => experiment.status !== "closed");

  // pilot planはowner承認後にregistryへ追加される。存在しない間は推測して作らない。
  const plan = (registry?.experiments ?? []).find((experiment: { portfolioPilot?: boolean }) => experiment.portfolioPilot === true) ?? null;
  const baseline = operations?.ga4Totals ?? null;
  const feasibility = plan && baseline
    ? estimateAffiliatePilotFeasibility({
        baselineImpressions: baseline.impressions,
        baselineClicks: baseline.clicks,
        baselineWindowDays: operations?.sources?.ga4?.days ?? 28,
        variantCount: plan.variantIds?.length ?? 2,
        minImpressionsPerVariant: plan.minImpressionsPerVariant,
        minClicksPerVariant: plan.minClicksPerVariant,
        maxDurationDays: plan.maxDurationDays,
      })
    : null;
  const state = buildAffiliatePilotState({
    nowIso: new Date().toISOString(),
    portfolio,
    plan,
    activeExperiments: activeExperiments.filter((experiment: { portfolioPilot?: boolean }) => experiment.portfolioPilot !== true),
    ownerApprovals: plan?.ownerApprovals ?? {},
    feasibility,
    observation: plan?.observation ?? null,
  });
  const errors = validateAffiliatePilotState(state);
  if (errors.length > 0) throw new Error(errors.join("\n"));
  writeFileSync(OUT_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");
  process.stdout.write(`affiliate pilot: readiness=${state.readiness.status}, verdict=${state.verdict.status}, next=${state.recommendedAction.id}\n`);
}

try {
  main();
} catch (error) {
  process.stderr.write(`[error] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
