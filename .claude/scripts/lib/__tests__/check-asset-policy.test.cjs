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

test("形式と拡張子の不一致 (中身png・拡張子gif) を検出する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "red" } }).png().toBuffer();
  fs.writeFileSync(path.join(f.root, "apps/web/public/mislabeled.gif"), png);
  const codes = JSON.parse(run(f).stdout).newFindings.map((x) => x.code);
  assert.ok(codes.includes("FORMAT_MISMATCH"));
});

test("SHA-256完全同一の重複画像を検出する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "blue" } }).png().toBuffer();
  fs.writeFileSync(path.join(f.root, "apps/web/public/dup-a.png"), png);
  fs.writeFileSync(path.join(f.root, "apps/web/public/dup-b.png"), png);
  const codes = JSON.parse(run(f).stdout).newFindings.map((x) => x.code);
  assert.ok(codes.includes("DUPLICATE_IMAGE"));
});

test("symlinkによる意図的な参照は重複として検出しない", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "purple" } }).png().toBuffer();
  fs.writeFileSync(path.join(f.root, "apps/web/public/real.png"), png);
  fs.symlinkSync("real.png", path.join(f.root, "apps/web/public/mirror.png"));
  const codes = JSON.parse(run(f).stdout).newFindings.map((x) => x.code);
  assert.ok(!codes.includes("DUPLICATE_IMAGE"));
});

test("symlinkが混在しても本物の重複は引き続き検出する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const png = await sharp({ create: { width: 8, height: 8, channels: 3, background: "orange" } }).png().toBuffer();
  fs.writeFileSync(path.join(f.root, "apps/web/public/real.png"), png);
  fs.writeFileSync(path.join(f.root, "apps/web/public/copy.png"), png);
  fs.symlinkSync("real.png", path.join(f.root, "apps/web/public/mirror.png"));
  const findings = JSON.parse(run(f).stdout).newFindings.filter((x) => x.code === "DUPLICATE_IMAGE");
  assert.equal(findings.length, 1, JSON.stringify(findings));
  assert.notEqual(findings[0].file, "apps/web/public/mirror.png");
});

test("未参照画像はwarningでblockしない", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.mkdirSync(path.join(f.root, "docs/assets"), { recursive: true });
  await sharp({ create: { width: 8, height: 8, channels: 3, background: "green" } }).png().toFile(path.join(f.root, "docs/assets/orphan-xyz.png"));
  const parsed = JSON.parse(run(f).stdout);
  assert.equal(parsed.newFindings.filter((x) => x.file.includes("orphan-xyz")).length, 0);
  assert.ok(parsed.warnings.some((w) => w.code === "UNREFERENCED_IMAGE" && w.file.includes("orphan-xyz")));
});

test("/public絶対参照の欠落を検出する", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  fs.writeFileSync(path.join(f.root, "apps/web/public/style.css"), ".x{background:url('/images/missing-abs.png')}\n");
  const codes = JSON.parse(run(f).stdout).newFindings.map((x) => x.code);
  assert.ok(codes.includes("MISSING_REFERENCE"));
});

test("コードスパン/コードブロック内の画像記法は参照とみなさない (手順例の誤検出防止)", async (t) => {
  const f = await fixture(); t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  // インラインコードスパンとフェンスドブロック内の ![](…) は「こう書け」という例示で実埋め込みではない。
  fs.writeFileSync(path.join(f.root, "docs/21_ブログ記事原稿/sample/guide.md"),
    "マーカーを `![alt](./images/screenshot-N-xxx.png)` に置換する。\n\n```md\n![例](data/nonexistent-in-fence.png)\n```\n");
  const parsed = JSON.parse(run(f).stdout);
  assert.equal(parsed.newFindings.filter((x) => x.code === "MISSING_REFERENCE" && x.file.includes("guide.md")).length, 0);
});
