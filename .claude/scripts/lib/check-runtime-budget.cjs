#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { performance } = require("node:perf_hooks");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const CONFIG = process.env.CHECK_RUNTIME_CONFIG || path.join(ROOT, ".claude/config/check-runtime-budgets.json");

function percentile(values, ratio) {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil(sorted.length * ratio) - 1)];
}
function appendSummary(results, total, suiteBudget) {
  const target = process.env.GITHUB_STEP_SUMMARY;
  if (!target) return;
  const rows = results.map((r) => `| ${r.name} | ${r.durationMs} | ${r.budgetMs} | ${r.status} |`).join("\n");
  fs.appendFileSync(target, `## Static checker runtime budget\n\n| Check | ms | Budget ms | Status |\n|---|---:|---:|---|\n${rows}\n\nTotal: **${total} ms / ${suiteBudget} ms**\n\n`);
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  const results = [];
  for (const check of config.checks) {
    const start = performance.now();
    const result = spawnSync(check.command[0], check.command.slice(1), { cwd: ROOT, encoding: "utf8", timeout: check.budgetMs * 2 });
    const durationMs = Math.ceil(performance.now() - start);
    const status = result.error?.code === "ETIMEDOUT" ? "timeout" : result.status !== 0 ? "failed" : durationMs > check.budgetMs ? "over-budget" : "ok";
    results.push({ name: check.name, durationMs, budgetMs: check.budgetMs, status });
    if (status === "failed") process.stderr.write(result.stderr || result.stdout || `${check.name} failed\n`);
  }
  const total = results.reduce((sum, item) => sum + item.durationMs, 0);
  const failures = results.filter((item) => item.status !== "ok");
  appendSummary(results, total, config.suiteBudgetMs);
  const report = { totalMs: total, suiteBudgetMs: config.suiteBudgetMs, p50Ms: percentile(results.map((r) => r.durationMs), .5), p95Ms: percentile(results.map((r) => r.durationMs), .95), results };
  if (process.argv.includes("--json")) console.log(JSON.stringify(report, null, 2));
  else {
    results.forEach((item) => console.log(`${item.status === "ok" ? "✓" : "✗"} ${item.name}: ${item.durationMs}ms / ${item.budgetMs}ms`));
    console.log(`static checker runtime: total=${total}ms p50=${report.p50Ms}ms p95=${report.p95Ms}ms budget=${config.suiteBudgetMs}ms`);
  }
  process.exitCode = failures.length || total > config.suiteBudgetMs ? 1 : 0;
}
if (require.main === module) main();
module.exports = { percentile };
