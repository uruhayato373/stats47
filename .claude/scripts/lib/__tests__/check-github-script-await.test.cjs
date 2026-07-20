const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-github-script-await.cjs");

function fixture(workflowBody) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-gh-await-"));
  fs.mkdirSync(path.join(dir, ".github/workflows"), { recursive: true });
  fs.writeFileSync(path.join(dir, ".github/workflows/x.yml"), workflowBody);
  return dir;
}

function run(dir) {
  const result = spawnSync(process.execPath, [CHECKER, "--json"], {
    cwd: dir,
    env: { ...process.env, CLAUDE_PROJECT_DIR: dir },
    encoding: "utf8",
  });
  return { ...result, output: JSON.parse(result.stdout) };
}

const HEADER = `jobs:
  x:
    steps:
      - uses: actions/github-script@v9
        with:
          script: |
`;

test("await 済みの GitHub API 呼び出しは受理する", (t) => {
  const dir = fixture(`${HEADER}            const { data } = await github.rest.pulls.get({});\n            await github.rest.issues.createComment({ body: "x" });\n`);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("裸の (未await) 呼び出しを検出する", (t) => {
  const dir = fixture(`${HEADER}            github.rest.issues.createComment({ body: "x" });\n`);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = run(dir);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((f) => f.code === "UNAWAITED_GH_CALL"));
});

test("コメントアウトされた呼び出しは無視する", (t) => {
  const dir = fixture(`${HEADER}            // github.rest.issues.createComment({ body: "x" });\n            await github.rest.pulls.get({});\n`);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("return / graphql も await 相当として扱う", (t) => {
  const dir = fixture(`${HEADER}            return github.graphql(query);\n`);
  t.after(() => fs.rmSync(dir, { recursive: true, force: true }));
  const result = run(dir);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});
