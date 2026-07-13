const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-checker-wiring.cjs");

function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-checker-wiring-"));
  const checker = path.join(root, ".claude/scripts/lib/check-checker-wiring.cjs");
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
  fs.copyFileSync(CHECKER, checker);
  fs.writeFileSync(
    path.join(root, ".github/workflows/checker-wiring.yml"),
    "run: node .claude/scripts/lib/check-checker-wiring.cjs\n",
  );
  fs.writeFileSync(path.join(root, "package.json"), "{}\n");
  return { root, checker };
}

function add(root, file, content = "#!/usr/bin/env node\n") {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function run(item, args = []) {
  const result = spawnSync(process.execPath, [item.checker, "--json", ...args], {
    cwd: item.root,
    encoding: "utf8",
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("別scriptから参照されるcheckerは配線済み", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  add(item.root, ".claude/scripts/audit/check-example.cjs");
  add(item.root, ".github/workflows/quality.yml", "run: node .claude/scripts/audit/check-example.cjs\n");
  const result = run(item);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("新規未配線checkerを検出する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  add(item.root, ".claude/scripts/audit/validate-orphan.mjs");
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.file.endsWith("validate-orphan.mjs")));
});

test("baseline内の既存未配線は許容する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  add(item.root, ".claude/scripts/audit/validate-known.mjs");
  execFileSync(process.execPath, [item.checker, "--write-baseline"], { cwd: item.root });
  const result = run(item, ["--baseline"]);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output.regressions.length, 0);
});

test("__tests__内のchecker fixtureは対象外", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  add(item.root, ".claude/scripts/lib/__tests__/check-fixture.cjs");
  const result = run(item);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});
