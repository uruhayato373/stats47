#!/usr/bin/env node
/** A8 成果SSOTをポートフォリオ判断へ利用できるか read-only で確認する。 */
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

import { evaluateA8OutcomeGate } from "./lib/a8-report-period-core.mjs";
import { repoRoot } from "./lib/asp-browser-base.mjs";

const root = repoRoot();
const affiliateDir = join(root, ".claude/state/metrics/affiliate");
const configPath = join(root, ".claude/config/a8-report-automation.json");

const readJson = (path) => (existsSync(path) ? JSON.parse(readFileSync(path, "utf8")) : null);
const cfg = readJson(configPath);
const gate = evaluateA8OutcomeGate({
  reportLog: readJson(join(affiliateDir, "a8-report-log.json")),
  results: readJson(join(affiliateDir, "a8-results.json")),
  nowIso: new Date().toISOString(),
  expectedSite: cfg?.a8?.targetSite ?? null,
});

if (process.argv.includes("--json")) {
  process.stdout.write(`${JSON.stringify(gate, null, 2)}\n`);
} else {
  console.log(`A8 outcomeGate: ${gate.status}`);
  if (gate.reasons.length > 0) console.log(`  reasons: ${gate.reasons.join(", ")}`);
  console.log(`  period: ${gate.period?.raw ?? "missing"}`);
  console.log(`  freshness: report=${gate.freshness.reportDays ?? "?"}d results=${gate.freshness.resultsDays ?? "?"}d`);
}

if (process.argv.includes("--require-ready") && gate.status !== "ready") process.exitCode = 2;
