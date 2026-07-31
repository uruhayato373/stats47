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
 * @param options.registered   vitest.workspace.ts に登録するパッケージ。省略時は全件
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
    path.join(root, "vitest.workspace.ts"),
    `export default [\n${registered.map((r) => `  '${r}/vitest.config.ts',`).join("\n")}\n];\n`,
  );
  fs.writeFileSync(path.join(root, "package-lock.json"), JSON.stringify({ lockfileVersion: 3, packages: lockPackages }));
  return { root, checker };
}

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

test("vitest.workspace.ts が無ければ検出する", (t) => {
  const item = fixture({ "packages/a": { name: "@stats47/a", main: "./src/index.ts" } });
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  fs.rmSync(path.join(item.root, "vitest.workspace.ts"));
  const result = run(item);
  assert.deepEqual(
    result.output.findings.map((f) => f.code),
    ["MISSING_VITEST_WORKSPACE"],
  );
});
