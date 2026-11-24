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

// ── CI の重い step の予算 (CI-SPEED-STATIC-GATES-HEAVY-STEPS-01) ──
// 静的 checker と違い、この 4 step は予算ファイルから再実行しない (同じ検査を 2 回走らせると CI が 90 秒延びる)。
// workflow の step が末尾で自分の経過秒 ($SECONDS) を渡し、予算ファイルの登録と突き合わせる。
const HEAVY_STEPS = ["workflow-commit-back", "seo-meta-factual", "image-generation-pipeline", "theme-portfolio-state"];
const MEASURE_LINE = (name) => `          node .claude/scripts/lib/check-runtime-budget.cjs --ci-step ${name} --elapsed-sec "$SECONDS"\n`;
function fixture({ steps, suiteBudgetMs = 100000, scopedSuiteBudgetMs, workflow }) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-runtime-budget-ci-"));
  fs.mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".github/workflows/pr.yml"), workflow ?? steps.map((step) => MEASURE_LINE(step.name)).join(""));
  const config = path.join(dir, "config.json");
  fs.writeFileSync(config, JSON.stringify({ version: 1, suiteBudgetMs: 5000, checks: [], ciSteps: { suiteBudgetMs, ...(scopedSuiteBudgetMs === undefined ? {} : { scopedSuiteBudgetMs }), steps: steps.map((step) => ({ workflow: ".github/workflows/pr.yml", ...step })) } }));
  return { dir, config };
}
function runIn(f, args) {
  const env = { ...process.env, CHECK_RUNTIME_CONFIG: f.config, STATS47_SCAN_ROOT: f.dir };
  delete env.GITHUB_STEP_SUMMARY; delete env.GITHUB_ACTIONS;
  const result = spawnSync(process.execPath, [CHECKER, ...args], { cwd: ROOT, encoding: "utf8", env });
  fs.rmSync(f.dir, { recursive: true, force: true }); return result;
}
test("実物の予算ファイルは常に走る CI の重い 4 step を登録し、予算の合計が 100 秒以下で、各 step が経過秒を渡す", () => {
  const config = JSON.parse(fs.readFileSync(path.join(ROOT, ".claude/config/check-runtime-budgets.json"), "utf8"));
  assert.ok(config.ciSteps, "ciSteps が無い = 重い step の予算が未登録");
  const always = config.ciSteps.steps.filter((step) => !step.scoped);
  assert.deepEqual(always.map((step) => step.name).sort(), [...HEAVY_STEPS].sort());
  assert.equal(config.ciSteps.suiteBudgetMs, 100000, "完了条件は対象 step の合計 100 秒以下");
  assert.ok(always.reduce((sum, step) => sum + step.budgetMs, 0) <= 100000);
  const { validateCiSteps } = require(CHECKER);
  assert.deepEqual(validateCiSteps(config, ROOT), []);
});
test("--ci-step は予算内の経過秒を受理する", () => {
  const result = runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "heavy", "--elapsed-sec", "30", "--json"]);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(JSON.parse(result.stdout), { name: "heavy", durationMs: 30000, budgetMs: 30000, limitMs: 60000, status: "ok" });
});
test("--ci-step は予算を超えて 2 倍以内なら警告だけ出して通す (runner の揺れで PR を落とさない)", () => {
  const result = runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "heavy", "--elapsed-sec", "60"]);
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /heavy: 60000ms \/ 30000ms/);
  assert.match(result.stdout, /予算超過/);
});
test("--ci-step は予算の 2 倍を超えたら落とす (115 秒へ戻る型の再肥大化を止める)", () => {
  const result = runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "heavy", "--elapsed-sec", "61"]);
  assert.equal(result.status, 1);
  assert.match(result.stderr, /上限 60000ms/);
});
test("--ci-step は未登録の step と数値でない経過秒を落とす", () => {
  assert.equal(runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "unknown", "--elapsed-sec", "1"]).status, 1);
  assert.equal(runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "heavy", "--elapsed-sec", ""]).status, 1);
  assert.equal(runIn(fixture({ steps: [{ name: "heavy", budgetMs: 30000 }] }), ["--ci-step", "heavy"]).status, 1);
});
test("引数なしの実行は、step の予算の合計が suite を超えると落とす", () => {
  const steps = [{ name: "a", budgetMs: 60000 }, { name: "b", budgetMs: 40001 }];
  const over = runIn(fixture({ steps }), []);
  assert.equal(over.status, 1); assert.match(over.stderr, /合計 100001ms が suite の 100000ms を超え/);
  assert.equal(runIn(fixture({ steps: [{ name: "a", budgetMs: 60000 }, { name: "b", budgetMs: 40000 }] }), []).status, 0);
});
test("引数なしの実行は、登録した step が workflow で経過秒を渡していないと落とす (コメントアウトも数えない)", () => {
  const steps = [{ name: "heavy", budgetMs: 30000 }];
  const missing = runIn(fixture({ steps, workflow: "          npm run heavy\n" }), []);
  assert.equal(missing.status, 1); assert.match(missing.stderr, /heavy.*--ci-step heavy/);
  assert.equal(runIn(fixture({ steps, workflow: `          # ${MEASURE_LINE("heavy").trim()}\n` }), []).status, 1);
  assert.equal(runIn(fixture({ steps, workflow: MEASURE_LINE("heavy-2") }), []).status, 1);
});
test("引数なしの実行は、名前の重複と欠けた項目を落とす", () => {
  assert.equal(runIn(fixture({ steps: [{ name: "a", budgetMs: 1000 }, { name: "a", budgetMs: 1000 }] }), []).status, 1);
  assert.equal(runIn(fixture({ steps: [{ name: "a", budgetMs: 0 }] }), []).status, 1);
});

// ── 差分連動の step の別枠 (CI-TOOLING-FOLLOWUP-02) ──
// Scoped Workflow Contract Gate は workflow とテスト自身が変わった PR だけ走り、2026-09-18 の 76 秒から 194 秒へ増えた。
// 常に走る step の 100 秒の枠に入れると枠が壊れるので、scoped: true の step は別枠 scopedSuiteBudgetMs と比べる。
test("差分連動の step (scoped: true) は常に走る step の合計に入れない", () => {
  const steps = [{ name: "a", budgetMs: 60000 }, { name: "b", budgetMs: 40000 }, { name: "scoped", budgetMs: 200000, scoped: true }];
  const result = runIn(fixture({ steps, scopedSuiteBudgetMs: 200000 }), []);
  assert.equal(result.status, 0, result.stderr);
});
test("差分連動の step の予算の合計が scopedSuiteBudgetMs を超えると落とす", () => {
  const steps = [{ name: "s1", budgetMs: 150000, scoped: true }, { name: "s2", budgetMs: 50001, scoped: true }];
  const over = runIn(fixture({ steps, scopedSuiteBudgetMs: 200000 }), []);
  assert.equal(over.status, 1); assert.match(over.stderr, /差分連動の step の予算の合計 200001ms/);
});
test("差分連動の step があるのに scopedSuiteBudgetMs が無いと落とす (別枠の上限なしで増えるのを止める)", () => {
  const result = runIn(fixture({ steps: [{ name: "s", budgetMs: 1000, scoped: true }] }), []);
  assert.equal(result.status, 1); assert.match(result.stderr, /scopedSuiteBudgetMs/);
});
test("scoped が真偽値でない登録を落とす", () => {
  const result = runIn(fixture({ steps: [{ name: "s", budgetMs: 1000, scoped: "yes" }], scopedSuiteBudgetMs: 1000 }), []);
  assert.equal(result.status, 1); assert.match(result.stderr, /scoped は true \/ false/);
});
test("--ci-step は差分連動の step も予算の 2 倍で落とす", () => {
  const steps = [{ name: "scoped", budgetMs: 200000, scoped: true }];
  assert.equal(runIn(fixture({ steps, scopedSuiteBudgetMs: 200000 }), ["--ci-step", "scoped", "--elapsed-sec", "194"]).status, 0);
  assert.equal(runIn(fixture({ steps, scopedSuiteBudgetMs: 200000 }), ["--ci-step", "scoped", "--elapsed-sec", "401"]).status, 1);
});
