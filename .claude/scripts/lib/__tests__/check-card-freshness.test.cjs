"use strict";

/**
 * check-card-freshness のテスト — 「カードが名指しするファイルを触った」を拾えるか。
 *
 * 背景 (2026-08-21): 同じセッションで「コードは直したがカードが古いまま」を 2 回やり、
 * どちらもオーナーの指摘で気づいた。実装後に当時のカード本文で再実行し、
 * 2 件とも鳴ることを確認している (素のファイル名を拾う規則が無いと 1 件しか拾えなかった)。
 *
 * ★reminder なので、止めないこと自体は仕様。ここで固定するのは「拾える / 雑音を出さない」の 2 点。
 */

const assert = require("node:assert/strict");
const test = require("node:test");

const {
  buildCardPathIndex,
  matchCards,
  makeBareResolver,
} = require("../check-card-freshness.cjs");

const CARD = [
  "### [FOO-01] 何かの施策",
  "タグ: [起票:2026-08-21]",
  "",
  "- 正典: `.claude/rules/foo-standards.md`",
  "- 実装: `packages/foo/src/bar.ts`",
  "",
  "### [BARE-01] 素のファイル名しか書いていないカード",
  "タグ: [起票:2026-08-21]",
  "",
  "- `data-refresh.yml` の push ステップが skip される",
  "",
  "### [NOISE-01] ありふれた名前しか書いていないカード",
  "タグ: [起票:2026-08-21]",
  "",
  "- `README.md` を直す",
  "",
].join("\n");

test("path を完全一致で引く", () => {
  const index = buildCardPathIndex(CARD);
  const hits = matchCards(index, ["packages/foo/src/bar.ts", "apps/web/src/unrelated.tsx"]);
  assert.deepEqual(hits.map((h) => h.id), ["FOO-01"]);
  assert.deepEqual(hits[0].files, ["packages/foo/src/bar.ts"]);
});

test("触っていないファイルでは鳴らない", () => {
  const index = buildCardPathIndex(CARD);
  assert.deepEqual(matchCards(index, ["apps/web/src/other.tsx"]), []);
});

test("ディレクトリを書かない素のファイル名も、変更集合の中で一意なら拾う", () => {
  // ★これが無いと 2026-08-21 の data-refresh の見逃しを拾えなかった
  //   (当時のカードは `data-refresh.yml` としか書いていなかった)。
  const changed = [".github/workflows/data-refresh.yml"];
  const index = buildCardPathIndex(CARD, makeBareResolver(changed));
  assert.deepEqual(matchCards(index, changed).map((h) => h.id), ["BARE-01"]);
});

test("同名ファイルを複数触ったときは素の名前で拾わない (どれか決められない)", () => {
  const changed = ["a/README.md", "b/README.md"];
  const index = buildCardPathIndex(CARD, makeBareResolver(changed));
  assert.deepEqual(matchCards(index, changed), [], "曖昧な素の名前で誤検知している");
});

test("素の名前は変更集合の中でしか解決しない (触っていないファイルに当たらない)", () => {
  const changed = ["packages/foo/src/bar.ts"];
  const index = buildCardPathIndex(CARD, makeBareResolver(changed));
  const ids = matchCards(index, changed).map((h) => h.id);
  assert.ok(!ids.includes("BARE-01"), "触っていない data-refresh.yml のカードが鳴っている");
});

test("カード置き場そのものは参照に数えない (全カードが当たってしまう)", () => {
  const card = ["### [X-01] a", "", "- `.claude/todo/backlog.md` を直す", ""].join("\n");
  const index = buildCardPathIndex(card, makeBareResolver([".claude/todo/backlog.md"]));
  assert.deepEqual(matchCards(index, [".claude/todo/backlog.md"]), []);
});
