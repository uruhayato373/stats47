const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const AUDITOR = path.join(ROOT, ".claude/scripts/lib/audit-workflow-policy.cjs");

function run(source, args = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-workflow-policy-"));
  const auditor = path.join(root, ".claude/scripts/lib/audit-workflow-policy.cjs");
  const workflow = path.join(root, ".github/workflows/test.yml");
  fs.mkdirSync(path.dirname(auditor), { recursive: true });
  fs.mkdirSync(path.dirname(workflow), { recursive: true });
  fs.copyFileSync(AUDITOR, auditor);
  fs.writeFileSync(workflow, source);
  const result = spawnSync(process.execPath, [auditor, "--json", ...args], {
    cwd: root,
    encoding: "utf8",
    env: { ...process.env, NODE_PATH: path.join(ROOT, "node_modules") },
  });
  fs.rmSync(root, { recursive: true, force: true });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("明示policyとSHA pinを受理する", () => {
  const result = run(`
name: test
on: { pull_request: {} }
permissions: { contents: read }
jobs:
  test:
    runs-on: ubuntu-latest
    timeout-minutes: 5
    steps:
      - uses: actions/checkout@0123456789012345678901234567890123456789
`);
  assert.equal(result.status, 0, result.stderr);
  assert.equal(result.output.findings, 0);
});

test("暗黙permissions・timeout欠落・tag pinを報告する", () => {
  const result = run(`
name: test
on: { pull_request: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
`);
  const codes = result.output.details.map((finding) => finding.code);
  assert.ok(codes.includes("PERMISSIONS_IMPLICIT"));
  assert.ok(codes.includes("JOB_NO_TIMEOUT"));
  assert.ok(codes.includes("ACTION_NOT_SHA_PINNED"));
  assert.equal(result.status, 0, "report-only must not fail");
});

test("--strictはfindingがあれば1を返す", () => {
  const result = run(`
name: test
on: { workflow_dispatch: {} }
jobs:
  test:
    runs-on: ubuntu-latest
    steps: []
`, ["--strict"]);
  assert.equal(result.status, 1);
});
