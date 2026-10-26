/**
 * CI の Node のバージョンを .nvmrc に揃えて固定する。
 * 実行: node --test .claude/scripts/lib/__tests__/workflow-node-version.test.cjs
 *
 * 2026-10-26 まで 51 本の workflow がサポート終了の Node 20、本番デプロイと手元は Node 22 で、
 * テストを本番と違う Node で回していた。workflow は `node-version-file: .nvmrc` にしない
 * (`ref: main` を checkout してから setup-node する workflow が、main に .nvmrc が無い間は失敗する) ので、
 * 版は各 workflow に直接書き、このテストで .nvmrc との一致を機械で保つ。
 */
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "../../../..");
const WORKFLOWS = path.join(ROOT, ".github/workflows");
const expected = fs.readFileSync(path.join(ROOT, ".nvmrc"), "utf8").trim();

function workflowFiles() {
  return fs.readdirSync(WORKFLOWS).filter((name) => /\.ya?ml$/.test(name)).map((name) => path.join(WORKFLOWS, name));
}

test(".nvmrc は major だけを書き、package.json の engines と一致する", () => {
  assert.match(expected, /^\d+$/);
  const engines = JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).engines;
  assert.equal(engines?.node, `>=${expected}`);
});

test("全 workflow の node-version が .nvmrc と一致する", () => {
  const mismatches = [];
  for (const file of workflowFiles()) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, index) => {
      const match = line.match(/^\s*node-version:\s*["']?([^"'\s#]+)["']?/);
      if (match && match[1] !== expected) mismatches.push(`${path.relative(ROOT, file)}:${index + 1} ${match[1]}`);
    });
  }
  assert.deepEqual(mismatches, [], `.nvmrc (${expected}) と違う node-version`);
});

test("setup-node を使う workflow はすべて node-version を書いている", () => {
  const missing = workflowFiles().filter((file) => {
    const text = fs.readFileSync(file, "utf8");
    return /uses:\s*actions\/setup-node@/.test(text) && !/^\s*node-version:/m.test(text);
  });
  assert.deepEqual(missing.map((file) => path.relative(ROOT, file)), []);
});
