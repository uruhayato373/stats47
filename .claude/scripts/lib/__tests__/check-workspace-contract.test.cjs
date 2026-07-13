const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-workspace-contract.cjs");

function fixture(packages) {
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
    lockPackages[relative] = { name: manifest.name };
  }
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
