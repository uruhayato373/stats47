const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");

const { findStaleRefs } = require("../check-docs-code-refs.cjs");

// docs が削除済みのスクリプト・スキル・npm script を現行手順として案内すると、agent は rules を直しても
// docs から廃止した手順へ戻る。ここでは「消えたものを指す参照だけが落ち、現存・予定・経緯・記事原稿は落ちない」を固定する。
function fixture(t, docs) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-docs-code-refs-"));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const write = (rel, text) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), text);
  };
  write("package.json", JSON.stringify({ scripts: { "docs:check": "x" } }));
  write("packages/tool/package.json", JSON.stringify({ scripts: { "tool:run": "x" } }));
  write(".claude/scripts/live.mjs", "");
  write(".claude/skills/sns/post-x-batch/SKILL.md", "");
  fs.mkdirSync(path.join(root, "apps/web/src/app/(site)/ranking"), { recursive: true });
  for (const [rel, text] of Object.entries(docs)) write(rel, text);
  return findStaleRefs(root).map((f) => `${f.file}:${f.line} ${f.kind} ${f.ref}`);
}

test("現存するパス・workspace の npm script・スキル・route group 配下の route は通る", (t) => {
  const hits = fixture(t, {
    "docs/a.md": [
      "`.claude/scripts/live.mjs:12` を使う",
      "`npm run docs:check` と `npm run tool:run`",
      "X は `/post-x-batch`、画面は `/ranking` と `/mcp`",
    ].join("\n"),
  });
  assert.deepEqual(hits, []);
});

test("削除済みのパス・npm script・スキルはそれぞれ検出する", (t) => {
  const hits = fixture(t, {
    "docs/a.md": [
      "`.claude/scripts/gone.mjs` を実行する",
      "`npm run gone:task`",
      "X は `/post-x-6angles` が主力",
    ].join("\n"),
  });
  assert.deepEqual(hits, [
    "docs/a.md:1 path .claude/scripts/gone.mjs",
    "docs/a.md:2 npm npm run gone:task",
    "docs/a.md:3 slash /post-x-6angles",
  ]);
});

test("予定・経緯と明記した行とプレースホルダは検査しない", (t) => {
  const hits = fixture(t, {
    "docs/a.md": [
      "- `.claude/scripts/next.mjs` (未実装)",
      "旧 `/post-x-6angles` は廃止した",
      "`.claude/state/<name>/latest.json`",
    ].join("\n"),
  });
  assert.deepEqual(hits, []);
});

test("note 記事原稿は読者環境の例示なので対象外", (t) => {
  const hits = fixture(t, { "docs/31_note記事原稿/x/draft.md": "`.claude/skills/my-skill/SKILL.md`" });
  assert.deepEqual(hits, []);
});
