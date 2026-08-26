const assert = require("node:assert/strict");
const { execFileSync, spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-env-registry.cjs");

function fixture(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-env-registry-"));
  const checker = path.join(root, ".claude/scripts/lib/check-env-registry.cjs");
  const app = path.join(root, "apps/web/src/env.ts");
  fs.mkdirSync(path.dirname(checker), { recursive: true });
  fs.mkdirSync(path.dirname(app), { recursive: true });
  fs.copyFileSync(CHECKER, checker);
  fs.writeFileSync(app, source);
  return { root, checker, registry: path.join(root, ".claude/config/env-registry.json") };
}

function run(item, args = []) {
  const result = spawnSync(process.execPath, [item.checker, "--json", ...args], { cwd: item.root, encoding: "utf8" });
  return { ...result, output: result.stdout ? JSON.parse(result.stdout) : null };
}

test("生成registryに値を保存せず分類する", (t) => {
  const item = fixture("process.env.NEXT_PUBLIC_BASE_URL; process.env.AUTH_SECRET;\n");
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  execFileSync(process.execPath, [item.checker, "--write-registry"], { cwd: item.root });
  const registry = JSON.parse(fs.readFileSync(item.registry));
  const targetVariables = registry.variables
    .filter((v) => ["AUTH_SECRET", "NEXT_PUBLIC_BASE_URL"].includes(v.name))
    .map((v) => [v.name, v.visibility]);
  assert.deepEqual(targetVariables, [
    ["AUTH_SECRET", "server"], ["NEXT_PUBLIC_BASE_URL", "public"],
  ]);
  assert.doesNotMatch(JSON.stringify(registry), /https?:\/\//);
});

test("未登録envを検出する", (t) => {
  const item = fixture("process.env.NEW_SERVER_SETTING;\n");
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  fs.mkdirSync(path.dirname(item.registry), { recursive: true });
  fs.writeFileSync(item.registry, JSON.stringify({ version: 1, variables: [] }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "ENV_UNREGISTERED"));
});

test("apps配下の.local生成物は走査しない", (t) => {
  const item = fixture("process.env.REGISTERED_SETTING;\n");
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  execFileSync(process.execPath, [item.checker, "--write-registry"], { cwd: item.root });
  const generated = path.join(item.root, "apps/admin/.local/next-e2e/server/chunk.js");
  fs.mkdirSync(path.dirname(generated), { recursive: true });
  fs.writeFileSync(generated, "process.env.GENERATED_ONLY_SETTING;\n");

  const result = run(item);
  assert.equal(result.status, 0);
  assert.equal(result.output.findings.length, 0);
});

test("公開接頭辞の機密名を検出する", (t) => {
  const item = fixture("process.env.NEXT_PUBLIC_PRIVATE_TOKEN;\n");
  t.after(() => fs.rmSync(item.root, { recursive: true, force: true }));
  fs.mkdirSync(path.dirname(item.registry), { recursive: true });
  fs.writeFileSync(item.registry, JSON.stringify({ version: 1, variables: [{ name: "NEXT_PUBLIC_PRIVATE_TOKEN", visibility: "public" }] }));
  const result = run(item);
  assert.equal(result.status, 1);
  assert.ok(result.output.findings.some((finding) => finding.code === "PUBLIC_SENSITIVE_NAME"));
});
