import assert from "node:assert/strict";
import test from "node:test";
import { audit, claudeHits, followRenames, isSource } from "../check-claude-boundary.mjs";

test("import・require・vi.mock・パスの文字列・'.claude' の組み立てを数え、コメントは数えない", () => {
  const text = [
    "// .claude/scripts/x.mjs はコメントなので数えない",
    "import { a } from '../../.claude/scripts/lib/a.mjs';",
    "const b = require('../.claude/scripts/b.cjs');",
    "vi.mock('../../../.claude/scripts/note/catalog', () => ({}));",
    "const p = path.join(root, '.claude', 'todo');",
    "const q = `${root}/.claude/state/x.json`;",
    "const ok = '@stats47/ops/media/workspace.mjs';",
  ].join("\n");
  assert.deepEqual(claudeHits(text, "x.ts"), [2, 3, 4, 5, 6]);
});

test("対象は apps・packages・config のソースだけ (型の宣言と node_modules は除く)", () => {
  assert.equal(isSource("apps/admin/lib/a.ts"), true);
  assert.equal(isSource("config/datasets.mjs"), true);
  assert.equal(isSource(".claude/scripts/lib/a.mjs"), false);
  assert.equal(isSource("packages/ops/src/a.d.mts"), false);
  assert.equal(isSource("apps/web/node_modules/x/a.js"), false);
});

test("基準に無いファイル・増加・基準の追加は止め、減ったら基準を縮めさせる", () => {
  const file = (path, n) => ({ path, text: Array.from({ length: n }, () => "x('.claude/todo');").join("\n") });
  const baseline = { "apps/admin/a.ts": { count: 2, reason: "管理画面が運用の状態を読む" } };
  assert.deepEqual(audit([file("apps/admin/a.ts", 2)], baseline, baseline), []);
  assert.match(audit([file("apps/web/b.ts", 1)], {}, {})[0], /基準に無い/);
  assert.match(audit([file("apps/admin/a.ts", 3)], baseline, baseline)[0], /増えた/);
  assert.match(audit([file("apps/admin/a.ts", 1)], baseline, baseline)[0], /縮める/);
  assert.match(audit([file("apps/admin/a.ts", 2)], baseline, {}).join("\n"), /縮小専用/);
});

test("改名したファイルの行は、元のパスの行を引き継ぐ", () => {
  const previous = { "old/a.ts": { count: 1, reason: "r" } };
  assert.deepEqual(followRenames(previous, [["old/a.ts", "new/a.ts"]])["new/a.ts"], { count: 1, reason: "r" });
});
