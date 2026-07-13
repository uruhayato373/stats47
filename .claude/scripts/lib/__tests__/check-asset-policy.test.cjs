const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const sharp = require("sharp");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-asset-policy.cjs");

async function fixture() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-asset-policy-"));
  const checker = CHECKER;
  fs.mkdirSync(path.join(root, "apps/web/public"), { recursive: true });
  fs.mkdirSync(path.join(root, "docs/21_ブログ記事原稿/sample/data"), { recursive: true });
  await sharp({ create: { width: 10, height: 10, channels: 3, background: "white" } }).png().toFile(path.join(root, "docs/21_ブログ記事原稿/sample/data/chart.png"));
  return { root, checker };
}
function run(f, args = ["--json"]) {
  return spawnSync(process.execPath, [f.checker, ...args], { cwd: f.root, encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: f.root } });
}

test("有効な本文画像参照を受理する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.root, "docs/21_ブログ記事原稿/sample/article.md"), "![chart](data/chart.png)\n");
  const result = run(f); assert.equal(result.status, 0, result.stderr); assert.deepEqual(JSON.parse(result.stdout).newFindings, []);
});

test("欠落した本文画像と危険なSVGを検出する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.root, "docs/21_ブログ記事原稿/sample/article.md"), "![missing](data/missing.png)\n");
  fs.writeFileSync(path.join(f.root, "apps/web/public/bad.svg"), '<svg><script/></svg>');
  const result = run(f); assert.equal(result.status, 1);
  const codes = JSON.parse(result.stdout).newFindings.map((x) => x.code);
  assert.ok(codes.includes("MISSING_REFERENCE")); assert.ok(codes.includes("SVG_VIEWBOX")); assert.ok(codes.includes("SVG_ACTIVE_CONTENT"));
});

test("baselineは既存findingを許容する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.root, "docs/21_ブログ記事原稿/sample/article.md"), "![missing](data/missing.png)\n");
  assert.equal(run(f, ["--write-baseline"]).status, 0);
  assert.equal(run(f, ["--baseline"]).status, 0);
});
