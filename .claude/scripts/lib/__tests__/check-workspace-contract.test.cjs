const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-workspace-contract.cjs");

/**
 * @param packages  relative path → package.json の内容
 * @param options.testFilesIn  テストファイルを置くパッケージ (UNWIRED_TEST_SUITE 用)
 * @param options.registered   root vitest.config.ts の projects に登録するパッケージ。省略時は全件
 * @param options.turbo        turbo.json の内容 (TURBO_MISSING_PASSTHROUGH_ENV 用)。
 *                             省略時は turbo.json を作らない = 検査対象外
 * @param options.prUnitTest   PR unit test 契約と fixture workflow
 */
function fixture(packages, options = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-workspace-contract-"));
  const checker = path.join(root, ".claude/scripts/lib/check-workspace-contract.cjs");
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.copyFileSync(CHECKER, checker);
  const lockPackages = { "": { name: "fixture" } };
  for (const [relative, manifest] of Object.entries(packages)) {
    const directory = path.join(root, relative);
    fs.mkdirSync(path.join(directory, "src"), { recursive: true });
    fs.writeFileSync(path.join(directory, "package.json"), `${JSON.stringify(manifest)}\n`);
    fs.writeFileSync(path.join(directory, "src/index.ts"), "export {};\n");
    if ((options.testFilesIn ?? []).includes(relative)) {
      fs.writeFileSync(path.join(directory, "src/index.test.ts"), "export {};\n");
    }
    lockPackages[relative] = { name: manifest.name };
  }
  const registered = options.registered ?? Object.keys(packages);
  fs.writeFileSync(
    path.join(root, "vitest.config.ts"),
    `export default { test: { projects: [\n${registered.map((r) => `  '${r}/vitest.config.ts',`).join("\n")}\n] } };\n`,
  );
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: lockPackages }));
  if (options.turbo !== undefined) {
    fs.writeFileSync(path.join(root, "turbo.json"), JSON.stringify(options.turbo));
  }
  if (options.prUnitTest !== undefined) {
    const { path: workspacePath, job = "test", command, workflow } = options.prUnitTest;
    fs.mkdirSync(path.join(root, ".claude/config"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".claude/config/quality-gates.json"),
      `${JSON.stringify({
        version: 1,
        workspaces: [{
          id: path.basename(workspacePath),
          path: workspacePath,
          lifecycle: "active",
          owner: "devops-runner",
          evidence: `${workspacePath}/package.json`,
          reviewBy: "2099-12-31",
          prUnitTest: { job, command },
        }],
        gates: [],
        exceptions: [],
      })}\n`,
    );
    fs.mkdirSync(path.join(root, ".github/workflows"), { recursive: true });
    fs.writeFileSync(
      path.join(root, ".github/workflows/pr-quality-check.yml"),
      workflow ?? `name: quality\non:\n  pull_request:\njobs:\n  ${job}:\n    steps:\n      - name: workspace tests\n        run: ${command}\n        continue-on-error: false\n  quality-check:\n    needs: [${job}]\n    steps:\n      - run: echo ok\n`,
    );
  }
  return { root, checker };
}

/** 実 turbo.json と同じ必須キー一式 (checker 側の定数と同じ並び)。 */
const FULL_PASSTHROUGH = [
  "NODE_EXTRA_CA_CERTS",
  "HTTP_PROXY",
  "HTTPS_PROXY",
  "NO_PROXY",
  "http_proxy",
  "https_proxy",
  "no_proxy",
];

function run(item) {
  const result = spawnSync(process.execPath, [item.checker, "--json"], { cwd: item.root, encoding: "utf8" });
  return { ...result, output: JSON.parse(result.stdout) };
}

test("整合したworkspace契約を受理する", (t) => {
  const item = fixture({
    "packages/a": { name: "@stats47/a", main: "./src/index.ts", types: "./src/index.ts", exports: { ".": "./src/index.ts" } },
    "apps/web": { name: "web", dependencies: { "@stats47/a": "*" } },
  });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("存在しないentrypointとworkspace依存を検出する", (t) => {
  const item = fixture({
    "packages/a": { name: "@stats47/a", main: "./src/missing.ts", dependencies: { "@stats47/missing": "*" } },
  });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  const codes = result.output.findings.map((finding) => finding.code);
  assert.equal(result.status, 1);
  assert.ok(codes.includes("MISSING_ENTRYPOINT"));
  assert.ok(codes.includes("MISSING_WORKSPACE_DEP"));
});

test("runtime workspace循環依存を検出する", (t) => {
  const item = fixture({
    "packages/a": { name: "@stats47/a", dependencies: { "@stats47/b": "*" } },
    "packages/b": { name: "@stats47/b", dependencies: { "@stats47/a": "*" } },
  });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "WORKSPACE_CYCLE"));
});

test("package-lockのworkspace欠落を検出する", (t) => {
  const item = fixture({ "packages/a": { name: "@stats47/a" } });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const lockFile = path.join(item.root, "package-lock.json");
  const lock = JSON.parse(fs.readFileSync(lockFile));
  delete lock.packages["packages/a"];
  fs.writeFileSync(lockFile, JSON.stringify(lock));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "LOCK_MISSING_WORKSPACE"));
});

// --- UNWIRED_TEST_SUITE (2026-07-31 追加) ---
// 「テストがあるのに workspace 未登録 = どこからも実行されない」を検出する。
// 全 PASS はゲートが何も見ていない状態と区別がつかないので、両方向を固定する。

test("テストを持つパッケージが未登録なら検出する", (t) => {
  const item = fixture(
    {
      "packages/a": { name: "@stats47/a", main: "./src/index.ts" },
      "packages/b": { name: "@stats47/b", main: "./src/index.ts" },
    },
    { testFilesIn: ["packages/b"], registered: ["packages/a"] },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  const unwired = result.output.findings.filter((f) => f.code === "UNWIRED_TEST_SUITE");
  assert.equal(unwired.length, 1);
  assert.match(unwired[0].message, /packages\/b/);
  assert.equal(result.status, 1);
});

test("テストを持たない未登録パッケージは検出しない (誤検知の抑止)", (t) => {
  const item = fixture(
    {
      "packages/a": { name: "@stats47/a", main: "./src/index.ts" },
      "packages/b": { name: "@stats47/b", main: "./src/index.ts" },
    },
    { registered: ["packages/a"] },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.deepEqual(result.output.findings, []);
  assert.equal(result.status, 0);
});

test("登録済みならテストを持っていても検出しない", (t) => {
  const item = fixture(
    { "packages/a": { name: "@stats47/a", main: "./src/index.ts" } },
    { testFilesIn: ["packages/a"] },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.deepEqual(result.output.findings, []);
});

test("node_modules 配下のテストは登録要求の根拠にしない", (t) => {
  const item = fixture(
    { "packages/a": { name: "@stats47/a", main: "./src/index.ts" } },
    { registered: [] },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const nested = path.join(item.root, "packages/a/node_modules/dep");
  fs.mkdirSync(nested, { recursive: true });
  fs.writeFileSync(path.join(nested, "dep.test.ts"), "export {};\n");
  const result = run(item);
  assert.deepEqual(result.output.findings, []);
});

test("root vitest.config.ts が無ければ検出する", (t) => {
  const item = fixture({ "packages/a": { name: "@stats47/a", main: "./src/index.ts" } });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  fs.rmSync(path.join(item.root, "vitest.config.ts"));
  const result = run(item);
  assert.deepEqual(
    result.output.findings.map((f) => f.code),
    ["MISSING_VITEST_CONFIG"],
  );
});

// --- PR_UNIT_TEST_NOT_BLOCKING (QG4) ---
// active app の unit test が package runner の外にある場合、PR workflow へ明示配線する。
// commandの欠落・soft-fail化・集約jobからの切断を別々のmutationで固定する。

test("registryに宣言したapp unit testがPRのblocking jobなら受理する", (t) => {
  const item = fixture(
    { "apps/admin": { name: "admin", scripts: { test: "vitest run" } } },
    {
      testFilesIn: ["apps/admin"],
      prUnitTest: {
        path: "apps/admin",
        command: "npm run test --workspace=apps/admin",
      },
    },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(result.output.findings, []);
});

test("registryのapp unit commandをworkflowから外すと検出する", (t) => {
  const item = fixture(
    { "apps/admin": { name: "admin", scripts: { test: "vitest run" } } },
    {
      testFilesIn: ["apps/admin"],
      prUnitTest: {
        path: "apps/admin",
        command: "npm run test --workspace=apps/admin",
        workflow: "name: quality\non:\n  pull_request:\njobs:\n  test:\n    steps:\n      - run: npm run test:packages\n  quality-check:\n    needs: [test]\n    steps:\n      - run: echo ok\n",
      },
    },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "PR_UNIT_TEST_NOT_BLOCKING"));
});

test("registryのapp unit commandをcontinue-on-errorにすると検出する", (t) => {
  const item = fixture(
    { "apps/admin": { name: "admin", scripts: { test: "vitest run" } } },
    {
      testFilesIn: ["apps/admin"],
      prUnitTest: {
        path: "apps/admin",
        command: "npm run test --workspace=apps/admin",
        workflow: "name: quality\non:\n  pull_request:\njobs:\n  test:\n    steps:\n      - run: npm run test --workspace=apps/admin\n        continue-on-error: true\n  quality-check:\n    needs: [test]\n    steps:\n      - run: echo ok\n",
      },
    },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "PR_UNIT_TEST_NOT_BLOCKING"));
});

test("app unit jobをrequired集約から外すと検出する", (t) => {
  const item = fixture(
    { "apps/admin": { name: "admin", scripts: { test: "vitest run" } } },
    {
      testFilesIn: ["apps/admin"],
      prUnitTest: {
        path: "apps/admin",
        command: "npm run test --workspace=apps/admin",
        workflow: "name: quality\non:\n  pull_request:\njobs:\n  test:\n    steps:\n      - run: npm run test --workspace=apps/admin\n  quality-check:\n    needs: [static-gates]\n    steps:\n      - run: echo ok\n",
      },
    },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "PR_UNIT_TEST_JOB_NOT_REQUIRED"));
});

// --- TURBO_MISSING_PASSTHROUGH_ENV (2026-08-04 追加) ---
// turbo 2.x の strict env mode が NODE_EXTRA_CA_CERTS を剥がすと、TLS 傍受プロキシ配下で
// dev サーバーの HTTPS が全滅する (症状は「ネットワーク障害」に見えるので切り分けが長い)。
// 全 PASS はゲートが何も見ていない状態と区別がつかないので、キーを 1 つずつ落として発火を固定する。

test("必須 passThrough env が揃った turbo.json は受理する", (t) => {
  const item = fixture(
    { "packages/a": { name: "@stats47/a", main: "./src/index.ts" } },
    { turbo: { globalPassThroughEnv: FULL_PASSTHROUGH, tasks: {} } },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.deepEqual(result.output.findings, []);
  assert.equal(result.status, 0);
});

test("キーを 1 つでも落とすと検出する (キーごとに発火することを固定)", (t) => {
  t.after(() => {});
  for (const dropped of FULL_PASSTHROUGH) {
    const item = fixture(
      { "packages/a": { name: "@stats47/a", main: "./src/index.ts" } },
      { turbo: { globalPassThroughEnv: FULL_PASSTHROUGH.filter((k) => k !== dropped), tasks: {} } },
    );
    const result = run(item);
    const missing = result.output.findings.filter((f) => f.code === "TURBO_MISSING_PASSTHROUGH_ENV");
    assert.equal(missing.length, 1, `${dropped} を落としたのに検出しなかった`);
    assert.match(missing[0].message, new RegExp(dropped));
    assert.equal(result.status, 1);
    fs.rmSync(item.root, { recursive: true, force: true });
  }
});

test("globalPassThroughEnv ごと消すと全キーを検出する", (t) => {
  const item = fixture(
    { "packages/a": { name: "@stats47/a", main: "./src/index.ts" } },
    { turbo: { tasks: {} } },
  );
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  const missing = result.output.findings.filter((f) => f.code === "TURBO_MISSING_PASSTHROUGH_ENV");
  assert.equal(missing.length, FULL_PASSTHROUGH.length);
});

test("turbo.json が無いリポジトリは検査しない (turbo 不在は静かな失敗ではない)", (t) => {
  const item = fixture({ "packages/a": { name: "@stats47/a", main: "./src/index.ts" } });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  const result = run(item);
  assert.deepEqual(result.output.findings, []);
});
