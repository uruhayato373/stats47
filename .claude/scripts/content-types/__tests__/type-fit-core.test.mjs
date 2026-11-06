import assert from "node:assert/strict";
import { test } from "node:test";

import { findMergePairs, isObservable, promiseGaps, proposeAction, publishedDateOf } from "../type-fit-core.mjs";

/**
 * 守る意図: 読まれている記事を撤去の案にしない。計測の前に公開した記事のクリック 0 を証拠にしない
 * (2026-11-06 に公開 10 日以内の 11 本を撤去の案にした)。同じ指標を題材にしただけの別の記事を統合の案にしない。
 */
const article = (over = {}) => ({ id: "blog:a", slug: "a", type: "type:paper", body: "相関であり因果ではない", rankingKeys: [], clicks: 0, impressions: 0, observable: true, ...over });

test("2 指標の相関は、クリックも表示も無いときだけ撤去の案にする", () => {
  assert.equal(proposeAction(article({ slug: "a-vs-b" }), undefined).proposal, "retire");
  assert.equal(proposeAction(article({ slug: "a-vs-b", clicks: 1 }), undefined), null);
  assert.equal(proposeAction(article({ slug: "a-vs-b", impressions: 10 }), undefined), null);
});

test("統合の案はクリックの無い記事だけに出す", () => {
  assert.equal(proposeAction(article(), "blog:main").proposal, "merge");
  assert.equal(proposeAction(article({ clicks: 3 }), "blog:main"), null);
});

test("型ごとの約束が欠けると書き直しの案になる", () => {
  assert.deepEqual(promiseGaps("type:paper", "順位の紹介だけの本文"), ["言える範囲の説明が無い"]);
  assert.deepEqual(promiseGaps("type:howto", "読み物だけの本文"), ["手順が無い"]);
  assert.deepEqual(promiseGaps("type:howto", "```bash\nnpm run\n```"), []);
  assert.deepEqual(promiseGaps("type:reference", "1 位は東京"), []);
  assert.equal(proposeAction(article({ body: "本文" }), undefined).proposal, "rewrite");
});

test("同じ型で同じ指標でも、作り方型と連載は統合の組にしない", () => {
  const a = article({ id: "blog:x", slug: "x-long", rankingKeys: ["k"], clicks: 5 });
  const b = article({ id: "blog:y", slug: "y-short", rankingKeys: ["k"] });
  assert.deepEqual([...findMergePairs([a, b])], [["blog:y", "blog:x"]]);
  const series = [article({ id: "blog:p", slug: "osaka-migration-flow", rankingKeys: ["k"], clicks: 5 }), article({ id: "blog:q", slug: "kyoto-migration-flow", rankingKeys: ["k"] })];
  assert.equal(findMergePairs(series).size, 0);
  const howto = [article({ id: "blog:h", slug: "cc-1", type: "type:howto", rankingKeys: ["k"] }), article({ id: "blog:i", slug: "cc-2", type: "type:howto", rankingKeys: ["k"] })];
  assert.equal(findMergePairs(howto).size, 0);
  const types = [article({ id: "blog:r", slug: "r-x", type: "type:reference", rankingKeys: ["k"] }), article({ id: "blog:s", slug: "s-y", rankingKeys: ["k"] })];
  assert.equal(findMergePairs(types).size, 0);
});

test("計測できていない記事はクリック 0 でも撤去・統合の案にしない", () => {
  assert.equal(proposeAction(article({ slug: "a-vs-b", observable: false }), undefined), null);
  assert.equal(proposeAction(article({ observable: false }), "blog:main"), null);
});

test("問いに答える記事は撤去の案にしない", () => {
  assert.equal(proposeAction(article({ slug: "a-vs-b", answers: true }), undefined), null);
});

test("公開から計測の終わりまで 28 日に満たない記事と、公開日の不明な記事は計測できていない", () => {
  assert.equal(isObservable("2026-08-30", "2026-10-25"), true);
  assert.equal(isObservable("2026-10-28", "2026-10-25"), false);
  assert.equal(isObservable("2026-10-01", "2026-10-25"), false);
  assert.equal(isObservable(null, "2026-10-25"), false);
  assert.throws(() => isObservable("2026-08-30", undefined), /日付が読めない/);
});

test("公開日を frontmatter から読む", () => {
  assert.equal(publishedDateOf("---\npublishedAt: 2026-08-30T00:00:00Z\n---"), "2026-08-30");
  assert.equal(publishedDateOf("---\ndate: '2026-08-30'\n---"), "2026-08-30");
  assert.equal(publishedDateOf("本文のみ"), null);
});
