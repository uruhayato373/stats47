/**
 * offer profile・creative・GA4・ASP成果を結ぶread-only派生state生成器。
 * 外部操作、ASP申請、R2 write、winner/priority変更は行わない。
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { AFFILIATE_ADS } from "../../../apps/web/scripts/affiliate-ads-data";
import { AFFILIATE_OFFER_PROFILES } from "../../../apps/web/scripts/affiliate-offer-profiles-data";
import { evaluateA8OutcomeGate } from "./lib/a8-report-period-core.mjs";
import {
  buildAffiliatePortfolioState,
  validateAffiliatePortfolioState,
} from "./lib/affiliate-portfolio-core.mjs";
import { evaluateMeasurementGate } from "./lib/affiliate-operations-core.mjs";
import { evaluateMoshimoOutcomeGate } from "./lib/moshimo-report-core.mjs";

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const STATE_DIR = resolve(ROOT, ".claude/state/ads");
const AFFILIATE_METRICS_DIR = resolve(ROOT, ".claude/state/metrics/affiliate");
const OUT_PATH = resolve(STATE_DIR, "affiliate-portfolio-latest.json");

function readJson(path: string): any | null {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function latestGa4(): { data: any; path: string } | null {
  const candidates: Array<{ date: string; path: string; absolute: string }> = [];
  for (const name of readdirSync(STATE_DIR)) {
    const match = /^ga4-affiliate-(\d{4}-\d{2}-\d{2})\.json$/.exec(name);
    if (match) candidates.push({ date: match[1], path: `.claude/state/ads/${name}`, absolute: resolve(STATE_DIR, name) });
  }
  const liveDir = resolve(STATE_DIR, "live", "ga4-affiliate");
  if (existsSync(liveDir)) {
    for (const name of readdirSync(liveDir)) {
      const match = /^(\d{4}-\d{2}-\d{2})\.json$/.exec(name);
      if (match) candidates.push({ date: match[1], path: `.claude/state/ads/live/ga4-affiliate/${name}`, absolute: resolve(liveDir, name) });
    }
  }
  const latest = candidates.sort((left, right) => left.date.localeCompare(right.date)).at(-1);
  return latest ? { data: readJson(latest.absolute), path: latest.path } : null;
}

function main(): void {
  if (process.argv.includes("--check")) {
    const state = readJson(OUT_PATH);
    const errors = state ? validateAffiliatePortfolioState(state) : ["state-missing"];
    if (errors.length > 0) {
      process.stderr.write(`[error] affiliate portfolio validate:\n- ${errors.join("\n- ")}\n`);
      process.exit(1);
    }
    process.stdout.write("✅ affiliate-portfolio-latest.json validate OK\n");
    return;
  }

  const nowIso = new Date().toISOString();
  const ga4 = latestGa4();
  const inventory = readJson(resolve(STATE_DIR, "inventory-latest.json"));
  const experimentRegistry = readJson(resolve(STATE_DIR, "experiments.json"))?.experiments ?? [];
  const activeExperiments = experimentRegistry.filter((experiment: { status?: string }) => experiment.status !== "closed");
  const portfolioPilots = experimentRegistry.filter((experiment: { portfolioPilot?: boolean }) => experiment.portfolioPilot === true);
  const otherActiveExperiments = activeExperiments.filter((experiment: { portfolioPilot?: boolean }) => experiment.portfolioPilot !== true);
  const measurementGate = evaluateMeasurementGate({
    ga4: ga4?.data ?? null,
    inventory,
    nowIso,
    hasActiveExperiments: activeExperiments.length > 0,
  });

  const reportLogPath = resolve(AFFILIATE_METRICS_DIR, "a8-report-log.json");
  const resultsPath = resolve(AFFILIATE_METRICS_DIR, "a8-results.json");
  const reportLog = readJson(reportLogPath);
  const a8Results = readJson(resultsPath);
  const moshimoResultsPath = resolve(AFFILIATE_METRICS_DIR, "moshimo-results.json");
  const moshimoResults = readJson(moshimoResultsPath);
  const moshimoOutcomeGate = evaluateMoshimoOutcomeGate(moshimoResults, nowIso);
  const requiresMoshimoOutcomes = AFFILIATE_ADS.some(
    (ad) => ad.isActive === true && ad.programRef?.startsWith("moshimo:"),
  );
  const config = readJson(resolve(ROOT, ".claude/config/a8-report-automation.json"));
  const outcomeGate = evaluateA8OutcomeGate({
    reportLog,
    results: a8Results,
    nowIso,
    expectedSite: config?.a8?.targetSite ?? null,
  });
  const sharedProgramRefs = (config?.a8?._sharedWithDobokuNote?.ids ?? []).map((id: string) => `a8:${id}`);

  const state = buildAffiliatePortfolioState({
    nowIso,
    ads: AFFILIATE_ADS,
    profiles: AFFILIATE_OFFER_PROFILES,
    ga4: ga4?.data ?? null,
    ga4Path: ga4?.path ?? null,
    measurementGate,
    a8Results,
    a8ResultsPath: a8Results ? ".claude/state/metrics/affiliate/a8-results.json" : null,
    outcomeGate,
    additionalOutcomeSources: [{
      source: "moshimo",
      programRefPrefix: "moshimo:",
      path: ".claude/state/metrics/affiliate/moshimo-results.json",
      data: moshimoResults,
      gate: moshimoOutcomeGate,
      required: requiresMoshimoOutcomes,
    }],
    sharedProgramRefs,
    activeExperiments: otherActiveExperiments,
    pilotExperimentIds: portfolioPilots.map((experiment: { experimentId: string }) => experiment.experimentId),
  });
  const errors = validateAffiliatePortfolioState(state);
  if (errors.length > 0) throw new Error(`generated portfolio invalid:\n- ${errors.join("\n- ")}`);
  writeFileSync(OUT_PATH, `${JSON.stringify(state, null, 2)}\n`, "utf8");

  if (process.argv.includes("--json")) {
    process.stdout.write(`${JSON.stringify(state, null, 2)}\n`);
    return;
  }
  process.stdout.write(
    `affiliate portfolio: ${state.gates.portfolio.status} ` +
      `(measurement=${state.gates.measurement.status}, outcome=${state.gates.outcome.status}, ` +
      `unclassified=${state.summary.unclassified})\n` +
      `next: ${state.recommendedActions[0]?.id ?? "none"}\n`,
  );
}

try {
  main();
} catch (error) {
  process.stderr.write(`[error] ${error instanceof Error ? error.message : String(error)}\n`);
  process.exit(1);
}
