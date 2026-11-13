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

// ── CI の重い step の予算 (ciSteps) ──
// 静的 checker (checks) はここから実行して測るが、CI の重い step は再実行しない (同じ検査が 2 回走り CI が延びる)。
// workflow の step が末尾で `--ci-step <name> --elapsed-sec "$SECONDS"` を呼び、bash が数えた経過秒を渡す。
// budgetMs は目標値で、合計が ciSteps.suiteBudgetMs 以下であることを引数なしの実行が検査する。
// runner の揺れで PR を落とさないよう、予算超過は警告に留め、予算の 2 倍 (静的 checker の打ち切りと同じ比) を超えたら落とす。
const CI_STEP_LIMIT_RATIO = 2;
const escapeRegExp = (/** @type {string} */ value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** 登録の形・予算の合計・workflow の計測行を検査し、違反の説明を返す。 */
function validateCiSteps(config, root) {
  const section = config.ciSteps;
  if (!section) return [];
  const errors = [];
  const names = new Set();
  let total = 0;
  for (const step of section.steps ?? []) {
    if (typeof step.name !== "string" || !step.name || typeof step.workflow !== "string" || !(step.budgetMs > 0)) {
      errors.push(`ciSteps: name / workflow / budgetMs (正の数) が要る: ${JSON.stringify(step)}`);
      continue;
    }
    if (names.has(step.name)) errors.push(`ciSteps: ${step.name} が重複している`);
    names.add(step.name);
    total += step.budgetMs;
    const file = path.join(root, step.workflow);
    const source = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
    const line = new RegExp(`^\\s*node \\.claude/scripts/lib/check-runtime-budget\\.cjs --ci-step ${escapeRegExp(step.name)} --elapsed-sec "\\$SECONDS"\\s*$`, "m");
    if (!line.test(source)) errors.push(`ciSteps: ${step.name} の step が ${step.workflow} で経過秒を渡していない (末尾に node .claude/scripts/lib/check-runtime-budget.cjs --ci-step ${step.name} --elapsed-sec "$SECONDS" が要る)`);
  }
  if (!(section.suiteBudgetMs > 0)) errors.push("ciSteps: suiteBudgetMs (正の数) が要る");
  else if (total > section.suiteBudgetMs) errors.push(`ciSteps: 予算の合計 ${total}ms が suite の ${section.suiteBudgetMs}ms を超えている`);
  return errors;
}

/** workflow の step が渡した経過秒を、登録した予算と突き合わせる。 */
function evaluateCiStep(config, name, elapsedSec) {
  const step = (config.ciSteps?.steps ?? []).find((item) => item.name === name);
  if (!step) return { name, status: "unregistered" };
  if (!Number.isFinite(elapsedSec) || elapsedSec < 0) return { name, status: "invalid-elapsed" };
  const durationMs = Math.round(elapsedSec * 1000);
  const limitMs = step.budgetMs * CI_STEP_LIMIT_RATIO;
  const status = durationMs > limitMs ? "over-limit" : durationMs > step.budgetMs ? "over-budget" : "ok";
  return { name, durationMs, budgetMs: step.budgetMs, limitMs, status };
}

function mainCiStep(config, name) {
  const raw = process.argv[process.argv.indexOf("--elapsed-sec") + 1];
  const elapsedSec = process.argv.includes("--elapsed-sec") && raw !== undefined && raw.trim() !== "" ? Number(raw) : Number.NaN;
  const result = evaluateCiStep(config, name, elapsedSec);
  if (result.status === "unregistered") {
    process.stderr.write(`✗ ${name}: ${path.relative(ROOT, CONFIG)} の ciSteps に登録が無い\n`);
  } else if (result.status === "invalid-elapsed") {
    process.stderr.write(`✗ ${name}: --elapsed-sec に経過秒 (0 以上の数) が要る\n`);
  } else {
    const summary = process.env.GITHUB_STEP_SUMMARY;
    if (summary) fs.appendFileSync(summary, `CI step runtime budget: **${name}** ${result.durationMs} ms / ${result.budgetMs} ms (${result.status})\n\n`);
    if (process.argv.includes("--json")) console.log(JSON.stringify(result));
    else if (result.status === "ok") console.log(`✓ ${name}: ${result.durationMs}ms / ${result.budgetMs}ms`);
    else if (result.status === "over-budget") {
      console.log(`⚠ ${name}: ${result.durationMs}ms / ${result.budgetMs}ms 予算超過 (上限 ${result.limitMs}ms までは通す)`);
      if (process.env.GITHUB_ACTIONS) console.log(`::warning title=CI step runtime budget::${name} ${result.durationMs}ms > ${result.budgetMs}ms`);
    } else process.stderr.write(`✗ ${name}: ${result.durationMs}ms が上限 ${result.limitMs}ms (予算 ${result.budgetMs}ms の ${CI_STEP_LIMIT_RATIO} 倍) を超えた\n`);
  }
  process.exitCode = result.status === "ok" || result.status === "over-budget" ? 0 : 1;
}

function main() {
  const config = JSON.parse(fs.readFileSync(CONFIG, "utf8"));
  const ciStepIndex = process.argv.indexOf("--ci-step");
  if (ciStepIndex !== -1) return mainCiStep(config, process.argv[ciStepIndex + 1] ?? "");
  const ciStepErrors = validateCiSteps(config, ROOT);
  for (const error of ciStepErrors) process.stderr.write(`✗ ${error}\n`);
  const results = [];
  for (const check of config.checks) {
    const start = performance.now();
    const result = spawnSync(check.command[0], check.command.slice(1), { cwd: ROOT, encoding: "utf8", timeout: check.budgetMs * 2 });
    const durationMs = Math.ceil(performance.now() - start);
    const status = /** @type {NodeJS.ErrnoException | undefined} */ (result.error)?.code === "ETIMEDOUT" ? "timeout" : result.status !== 0 ? "failed" : durationMs > check.budgetMs ? "over-budget" : "ok";
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
    if (config.ciSteps) console.log(`ci step budgets: ${(config.ciSteps.steps ?? []).length} steps total=${(config.ciSteps.steps ?? []).reduce((sum, step) => sum + (step.budgetMs || 0), 0)}ms suite=${config.ciSteps.suiteBudgetMs}ms`);
  }
  process.exitCode = failures.length || total > config.suiteBudgetMs || ciStepErrors.length ? 1 : 0;
}
if (require.main === module) main();
module.exports = { percentile, validateCiSteps, evaluateCiStep };
