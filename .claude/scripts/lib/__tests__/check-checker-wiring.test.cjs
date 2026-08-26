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
  writeRegistry(root, []);
  return { root, checker };
}

function add(root, file, content = "#!/usr/bin/env node\n") {
  const absolute = path.join(root, file);
  fs.mkdirSync(path.dirname(absolute), { recursive: true });
  fs.writeFileSync(absolute, content);
}

function writeRegistry(root, gates, exceptions = []) {
  const self = gate(
    "checker-wiring-self",
    ".claude/scripts/lib/check-checker-wiring.cjs",
    { trigger: ["manual"] },
  );
  add(
    root,
    ".claude/config/quality-gates.json",
    `${JSON.stringify({ version: 1, workspaces: [], gates: [self, ...gates], exceptions }, null, 2)}\n`,
  );
}

function gate(id, checker, overrides = {}) {
  return {
    id,
    checker,
    command: `node ${checker}`,
    scope: ["repository"],
    owner: "devops-runner",
    trigger: ["pull_request"],
    blocking: true,
    networkOrSecrets: "none",
    timeoutMinutes: 2,
    ...overrides,
  };
}

function run(item, args = []) {
  const result = spawnSync(process.execPath, [item.checker, "--json", ...args], {
    cwd: item.root,
    encoding: "utf8",
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("別scriptから参照される非critical checkerは配線済み", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  add(item.root, ".claude/scripts/audit/check-example.cjs");
  add(item.root, ".claude/scripts/run-example.mjs", "node .claude/scripts/audit/check-example.cjs\n");
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

test("未配線checkerをdeclared-onlyとして分類する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-declared-only.cjs";
  add(item.root, checker);
  writeRegistry(item.root, [gate("declared-only", checker)]);

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "DECLARED_ONLY_GATE"));
  assert.deepEqual(
    result.output.classifications.find((entry) => entry.file === checker),
    {
      file: checker,
      declared: true,
      invoked: false,
      blocking: false,
      scheduled: false,
    },
  );
});

test("docsだけの参照はcritical gateの配線に数えない", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-docs-only.cjs";
  add(item.root, checker);
  add(item.root, ".claude/skills/example/SKILL.md", `run ${checker}\n`);
  writeRegistry(item.root, [gate("docs-only", checker)]);

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "DOCS_ONLY_GATE"));
});

test("continue-on-error workflowはblocking gateに数えない", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-soft-fail.cjs";
  add(item.root, checker);
  add(
    item.root,
    ".github/workflows/quality.yml",
    `name: quality\non:\n  pull_request:\njobs:\n  quality:\n    steps:\n      - run: node ${checker}\n        continue-on-error: true\n`,
  );
  writeRegistry(item.root, [gate("soft-fail", checker)]);

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "NON_BLOCKING_GATE"));
  assert.equal(result.output.classifications.find((entry) => entry.file === checker).invoked, true);
  assert.equal(result.output.classifications.find((entry) => entry.file === checker).blocking, false);
});

test("期限切れ例外を拒否する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-expired.cjs";
  add(item.root, checker);
  writeRegistry(item.root, [gate("expired", checker)], [
    {
      code: "DECLARED_ONLY_GATE",
      file: checker,
      reason: "temporary fixture",
      expiresAt: "2000-01-01",
    },
  ]);

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "EXPIRED_EXCEPTION"));
});

test("registryの重複IDと存在しないcommandを拒否する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-valid.cjs";
  add(item.root, checker);
  writeRegistry(item.root, [
    gate("duplicate", checker),
    gate("duplicate", checker, {
      checker: ".claude/scripts/audit/check-missing.cjs",
      command: "node .claude/scripts/audit/check-missing.cjs",
    }),
  ]);

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "DUPLICATE_GATE_ID"));
  assert.ok(result.output.findings.some((finding) => finding.code === "COMMAND_NOT_FOUND"));
});

test("blockingまたはscheduledな未宣言checkerを拒否する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const blocking = ".claude/scripts/audit/check-blocking-undeclared.cjs";
  const scheduled = ".claude/scripts/audit/check-scheduled-undeclared.cjs";
  add(item.root, blocking);
  add(item.root, scheduled);
  add(
    item.root,
    ".github/workflows/quality.yml",
    `name: quality\non:\n  pull_request:\n  schedule:\n    - cron: "0 0 * * *"\njobs:\n  quality:\n    steps:\n      - run: node ${blocking}\n      - run: node ${scheduled}\n        continue-on-error: true\n`,
  );

  const result = run(item);

  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some(
    (finding) => finding.code === "UNDECLARED_CRITICAL_CHECKER" && finding.file === blocking,
  ));
  assert.ok(result.output.findings.some(
    (finding) => finding.code === "UNDECLARED_CRITICAL_CHECKER" && finding.file === scheduled,
  ));
});

test("未宣言criticalはbaselineへ入れても拒否する", (t) => {
  const item = fixture();
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const checker = ".claude/scripts/audit/check-critical-baselined.cjs";
  add(item.root, checker);
  add(item.root, ".github/workflows/quality.yml", `- run: node ${checker}\n`);
  execFileSync(process.execPath, [item.checker, "--write-baseline"], { cwd: item.root });

  const result = run(item, ["--baseline"]);

  assert.equal(result.status, 1);
  assert.ok(result.output.regressions.some(
    (finding) => finding.code === "UNDECLARED_CRITICAL_CHECKER" && finding.file === checker,
  ));
});
