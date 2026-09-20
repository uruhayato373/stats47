/** 公開pilotの開始可否・必要母数・観測判定をread-only stateへ生成する。 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import {
  buildAffiliatePilotState,
  estimateAffiliatePilotFeasibility,
  validateAffiliatePilotState,
} from "./lib/affiliate-pilot-core.mjs";
import {
  aggregatePilotExperimentMetrics,
  buildAffiliatePilotObservation,
  parseAffiliateExperimentHistory,
} from "./lib/affiliate-pilot-history-core.mjs";

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
  const ga4Path = portfolio?.sources?.ga4?.path ? resolve(ROOT, portfolio.sources.ga4.path) : null;
  const ga4 = ga4Path ? readJson(ga4Path) : null;
  const feasibility = plan && baseline
    ? estimateAffiliatePilotFeasibility({
        baselineImpressions: baseline.impressions,
        baselineClicks: baseline.clicks,
        baselineWindowDays: ga4?.days ?? 28,
        variantCount: plan.variantIds?.length ?? 2,
        minImpressionsPerVariant: plan.minImpressionsPerVariant,
        minClicksPerVariant: plan.minClicksPerVariant,
        maxDurationDays: plan.maxDurationDays,
      })
    : null;
  const historyPath = resolve(STATE_DIR, "affiliate-experiment-history.csv");
  const historyRows = existsSync(historyPath)
    ? parseAffiliateExperimentHistory(readFileSync(historyPath, "utf8"))
    : [];
  const experimentMetrics = plan
    ? aggregatePilotExperimentMetrics({
        rows: historyRows,
        experimentId: plan.experimentId,
        startedAt: plan.startedAt,
        exposureEndedAt: plan.exposureEndedAt ?? null,
      })
    : [];
  const moshimo = readJson(resolve(ROOT, ".claude/state/metrics/affiliate/moshimo-results.json"));
  const moshimoSource = portfolio?.sources?.additionalOutcomes?.find((source: { source?: string }) => source.source === "moshimo");
  const observation = plan
    ? buildAffiliatePilotObservation({
        plan,
        experimentMetrics,
        outcomeSources: [{
          programRefPrefix: "moshimo:",
          status: moshimoSource?.status ?? "blocked",
          periodFrom: moshimo?.period?.from ?? null,
          periodTo: moshimo?.period?.to ?? null,
          revenueByProgramRef: Object.fromEntries((moshimo?.records ?? []).map((record: { programRef: string; revenueYen: number }) => [record.programRef, record.revenueYen])),
        }],
        nowIso: new Date().toISOString(),
      })
    : null;
  const state = buildAffiliatePilotState({
    nowIso: new Date().toISOString(),
    portfolio,
    plan,
    activeExperiments: activeExperiments.filter((experiment: { portfolioPilot?: boolean }) => experiment.portfolioPilot !== true),
    ownerApprovals: plan?.ownerApprovals ?? {},
    feasibility,
    observation: plan?.observation ?? observation,
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
