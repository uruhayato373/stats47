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

const ROOT = resolve(fileURLToPath(new URL(".", import.meta.url)), "../../..");
const STATE_DIR = resolve(ROOT, ".claude/state/ads");
const AFFILIATE_METRICS_DIR = resolve(ROOT, ".claude/state/metrics/affiliate");
const OUT_PATH = resolve(STATE_DIR, "affiliate-portfolio-latest.json");

function readJson(path: string): any | null {
  return existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null;
}

function latestGa4(): { data: any; path: string } | null {
  const name = readdirSync(STATE_DIR)
    .filter((candidate) => /^ga4-affiliate-\d{4}-\d{2}-\d{2}\.json$/.test(candidate))
    .sort()
    .at(-1);
  return name ? { data: readJson(resolve(STATE_DIR, name)), path: `.claude/state/ads/${name}` } : null;
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
    sharedProgramRefs,
    activeExperiments,
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
