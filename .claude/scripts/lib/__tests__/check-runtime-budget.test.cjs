const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-runtime-budget.cjs");
function run(checks, suiteBudgetMs = 5000) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-runtime-budget-"));
  const config = path.join(dir, "config.json");
  fs.writeFileSync(config, JSON.stringify({ version: 1, suiteBudgetMs, checks }));
  const result = spawnSync(process.execPath, [CHECKER, "--json"], { cwd: ROOT, encoding: "utf8", env: { ...process.env, CHECK_RUNTIME_CONFIG: config } });
  fs.rmSync(dir, { recursive: true, force: true }); return result;
}
test("予算内のcheckを受理する", () => {
  const result = run([{ name: "ok", budgetMs: 1000, command: [process.execPath, "-e", "process.exit(0)"] }]);
  assert.equal(result.status, 0, result.stderr); assert.equal(JSON.parse(result.stdout).results[0].status, "ok");
});
test("失敗したcheckを検出する", () => {
  const result = run([{ name: "bad", budgetMs: 1000, command: [process.execPath, "-e", "process.exit(2)"] }]);
  assert.equal(result.status, 1); assert.equal(JSON.parse(result.stdout).results[0].status, "failed");
});
test("percentileを計算する", () => {
  const { percentile } = require(CHECKER); assert.equal(percentile([1, 2, 3, 100], .95), 100); assert.equal(percentile([1, 2, 3, 4], .5), 2);
});
