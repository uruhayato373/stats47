const assert = require("node:assert/strict");
const { spawnSync } = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const CHECKER = path.join(ROOT, ".claude/scripts/lib/check-maintenance-debt.cjs");
function fixture(source) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-maintenance-debt-"));
  fs.mkdirSync(path.join(root, "apps/web/src"), { recursive: true });
  fs.writeFileSync(path.join(root, "apps/web/src/sample.ts"), source);
  return root;
}
function run(root, args = ["--json"]) {
  return spawnSync(process.execPath, [CHECKER, ...args], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root } });
}
test("追跡情報付きTODOを受理する", (t) => {
  const root = fixture("// TODO #123: migrate later\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stderr);
});
test("無根拠TODOとD1 runtime復活を検出する", (t) => {
  const root = fixture("// TODO: later\ngetDrizzle();\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1);
  const codes = JSON.parse(result.stdout).newFindings.map((item) => item.code);
  assert.ok(codes.includes("UNTRACKED_DEBT")); assert.ok(codes.includes("D1_RUNTIME_RETURN"));
});
test("小文字の todo (識別子/DOM id/パス) は debt として検出しない", (t) => {
  const root = fixture('const todo = tiles.filter(Boolean);\npage.locator("section#todo");\n// see ../../todo/weekly.md\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("文字列リテラルとTODO運用規約への言及はdebtとして検出しない", (t) => {
  const root = fixture('const message = "TODO IDが重複";\n// TODO IDの形式を検査する。\n// TODO台帳へ移す。\n');
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test(".claude/todo/ backlog への参照はdebtとして検出しない (2026-08-19 site-ux-manager.md:98 誤検知)", (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-maintenance-debt-"));
  fs.mkdirSync(path.join(root, ".claude/agents"), { recursive: true });
  fs.writeFileSync(
    path.join(root, ".claude/agents/sample.md"),
    "- active TODO: `.claude/todo/improvements.md` / `.claude/todo/backlog.md`\n",
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("ネストした .local の生成物は保守負債の走査対象にしない", (t) => {
  const root = fixture("export const source = true;\n");
  const generated = path.join(root, "apps/admin/.local/next-e2e/server");
  fs.mkdirSync(generated, { recursive: true });
  const todoMarker = "TO" + "DO";
  const deprecatedMarker = "depre" + "cated";
  fs.writeFileSync(path.join(generated, "vendor.js"), `// ${todoMarker}: dependency source\n// ${deprecatedMarker} generated code\n`);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root);
  assert.equal(result.status, 0, result.stdout + result.stderr);
});
function mdFixture(content) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-maintenance-debt-"));
  fs.mkdirSync(path.join(root, ".claude/todo"), { recursive: true });
  fs.writeFileSync(path.join(root, ".claude/todo/backlog.md"), content);
  return root;
}

test("同一Markdownブロック内の停止条件フィールドはlegacy行を除外する (2026-08-19 CROSS-PAGE-DATA-SSOT-01 誤検知)", (t) => {
  const root = mdFixture(
    "### [SAMPLE-01] タイトル\n" +
    "- legacy件数が単調減少することを確認する。\n" +
    "- **停止条件**:\n" +
    "  - 何らかの条件。\n" +
    "### [SAMPLE-02] 次のカード\n",
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("別ブロックの停止条件は越境して適用されない (ブロック境界の実効性)", (t) => {
  const root = mdFixture(
    "### [SAMPLE-01] legacyカード\n" +
    "- legacy件数が単調減少することを確認する。\n" +
    "### [SAMPLE-02] 別カード\n" +
    "- **停止条件**:\n" +
    "  - 何らかの条件。\n",
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
  const codes = JSON.parse(result.stdout).newFindings.map((item) => item.code);
  assert.ok(codes.includes("UNBOUNDED_LEGACY"));
});

test("ブロック内の無関係な「期限」「互換」の地の文はlegacy行を除外しない (太字フィールドのみ有効)", (t) => {
  const root = mdFixture(
    "### [SAMPLE-01] タイトル\n" +
    "- legacy件数が単調減少することを確認する。\n" +
    "- 別の話題: R2 schemaの互換性と期限について触れるが、これはカードの停止条件ではない。\n" +
    "### [SAMPLE-02] 次のカード\n",
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
  const codes = JSON.parse(result.stdout).newFindings.map((item) => item.code);
  assert.ok(codes.includes("UNBOUNDED_LEGACY"));
});

test("baselineは既存findingを許容する", (t) => {
  const root = fixture("// FIXME: later\n"); t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  assert.equal(run(root, ["--write-baseline"]).status, 0); assert.equal(run(root, ["--baseline"]).status, 0);
});

test("同一行の「縮小専用」はlegacy行を除外する (2026-08-20 geo-scope-national-sentinel-ratchet.test.ts:7 誤検知)", (t) => {
  const root = fixture(
    '/**\n * `selectedPrefectureCode ?? "00000"` (legacy sentinel) の縮小専用ラチェット\n */\nconst BASELINE = 1;\n',
  );
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});

test("「縮小専用」を伴わない対象語の行は引き続き検出する (誤って全件を素通りさせていないこと)", (t) => {
  // スラッシュを分離連結: この行自身がチェッカーの自己走査でコメント本体として
  // 誤検出され baseline 増加になるのを避ける (2026-08-20 実測)。
  const marker = "leg" + "acy";
  const root = fixture("/" + "/ " + marker + ": この分岐はいずれ消す\n");
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
  const codes = JSON.parse(result.stdout).newFindings.map((item) => item.code);
  assert.ok(codes.includes("UNBOUNDED_LEGACY"));
});
// サイト識別子のリテラルはこのテスト自身が自己走査で検出されないよう連結して作る (__tests__ は対象外だが念のため)。
const SITE_R2 = "https://" + "storage.stats47.jp";
test("サイト識別子の完全一致リテラルを SITE_IDENTITY_LITERAL として検出する (2026-10-06 SSOT 集約の再発止め)", (t) => {
  const root = fixture(`const R2 = process.env.R2_PUBLIC_URL || "${SITE_R2}";\nconst ID = '463218070';\n`);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
  const found = JSON.parse(result.stdout).newFindings.filter((item) => item.code === "SITE_IDENTITY_LITERAL");
  assert.equal(found.length, 2);
});
test("パス付き URL・コメント・テストファイルのサイト識別子は検出しない", (t) => {
  const root = fixture(`const url = "${SITE_R2}/app/blog/all.json";\n/` + `/ 既定は ${SITE_R2}\n`);
  fs.mkdirSync(path.join(root, "apps/web/src/__tests__"), { recursive: true });
  fs.writeFileSync(path.join(root, "apps/web/src/__tests__/sample.test.ts"), `expect(base).toBe("${SITE_R2}");\n`);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("チェッカーが変わったらローカルの stat キャッシュを使わない (新ルールが未変更ファイルにも当たる)", (t) => {
  const root = fixture(`const R2 = "${SITE_R2}";\n`);
  const cache = path.join(root, ".local/maintenance-debt-cache.json");
  fs.mkdirSync(path.dirname(cache), { recursive: true });
  const st = fs.statSync(path.join(root, "apps/web/src/sample.ts"));
  // 旧チェッカーで「問題なし」と記録されたキャッシュを置く
  fs.writeFileSync(cache, JSON.stringify({ version: 1, checker: "old", entries: { "apps/web/src/sample.ts": { size: st.size, mtimeMs: st.mtimeMs, results: [] } } }));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = spawnSync(process.execPath, [CHECKER, "--json"], { encoding: "utf8", env: { ...process.env, CLAUDE_PROJECT_DIR: root, MAINTENANCE_DEBT_CACHE: cache } });
  assert.equal(result.status, 1, result.stdout + result.stderr);
  assert.ok(JSON.parse(result.stdout).newFindings.some((item) => item.code === "SITE_IDENTITY_LITERAL"));
});
// DEBT-CHECK-GITIGNORED-SCAN-01: 走査対象は git が見ているファイルに限る。
// gitignore 済みのファイル (commit されない生成物・ローカル専用) で止めず、追跡中のファイルでは今までどおり止める。
function gitFixture() {
  const root = fixture("export const source = true;\n");
  const git = (...args) => {
    const r = spawnSync("git", ["-C", root, ...args], { encoding: "utf8" });
    assert.equal(r.status, 0, r.stderr);
  };
  git("init", "-q");
  fs.writeFileSync(path.join(root, ".gitignore"), "apps/web/src/ignored.ts\n");
  git("add", ".gitignore", "apps/web/src/sample.ts");
  return { root, git };
}
const LEGACY_LINE = "// " + "depre" + "cated helper, still used\n";
test("gitignore 済みのファイルに書かれた debt は検出しない", (t) => {
  const { root } = gitFixture();
  fs.writeFileSync(path.join(root, "apps/web/src/ignored.ts"), LEGACY_LINE);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 0, result.stdout + result.stderr);
});
test("追跡中のファイルと未追跡 (ignore されていない) ファイルの debt は git 走査でも検出する", (t) => {
  const { root, git } = gitFixture();
  fs.writeFileSync(path.join(root, "apps/web/src/tracked.ts"), LEGACY_LINE);
  git("add", "apps/web/src/tracked.ts");
  fs.writeFileSync(path.join(root, "apps/web/src/untracked.ts"), LEGACY_LINE);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
  const files = JSON.parse(result.stdout).newFindings.map((item) => item.file).sort();
  assert.deepEqual(files, ["apps/web/src/tracked.ts", "apps/web/src/untracked.ts"]);
});
test("git repo でないときは従来どおりディスクを辿って検出する", (t) => {
  const root = fixture(LEGACY_LINE);
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const result = run(root); assert.equal(result.status, 1, result.stdout + result.stderr);
});
