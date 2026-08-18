const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-maintenance-debt.cjs");
function fixture(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-maintenance-debt-"));
  fs.mkdirSync(path.join(root, "apps/web/src"), { recursive: true });
  fs.writeFileSync(path.join(root, "apps/web/src/sample.ts"), source);
  return root;
}
function run(root, args = ["--json"]) {
  return spawnSync(process.execPath, [CHECKER, ...args], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
}
test("追跡情報付きTODOを受理する", (t) => {
  const root = fixture("// TODO #123: migrate later\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stderr);
});
test("無根拠TODOとD1 runtime復活を検出する", (t) => {
  const root = fixture("// TODO: later\ngetDrizzle();\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1);
  const codes = JSON.parse(result.stdout).newFindings.map((item) => item.code);
  assert.ok(codes.includes("UNTRACKED_DEBT")); assert.ok(codes.includes("D1_RUNTIME_RETURN"));
});
test("小文字の todo (識別子/DOM id/パス) は debt として検出しない", (t) => {
  const root = fixture('const todo = tiles.filter(Boolean);\npage.locator("section#todo");\n// see ../../todo/weekly.md\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("文字列リテラルとTODO運用規約への言及はdebtとして検出しない", (t) => {
  const root = fixture('const message = "TODO IDが重複";\n// TODO IDの形式を検査する。\n// TODO台帳へ移す。\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("baselineは既存findingを許容する", (t) => {
  const root = fixture("// FIXME: later\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root, ["--write-baseline"]).status, 0); assert.equal(run(root, ["--baseline"]).status, 0);
});
