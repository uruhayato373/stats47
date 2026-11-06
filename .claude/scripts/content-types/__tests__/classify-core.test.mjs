import assert from "node:assert/strict";
import { test } from "node:test";

import { classifyAll, findStaleAssignments } from "../classify-core.mjs";

/**
 * 守る意図: 新しいコンテンツは型が決まらなければ null になり、検査で止まる。
 * 規則に当たらない新しい種別を「たまたま」どれかの型へ倒さない。
 */
const rules = {
  pageKinds: { ranking: "type:reference" },
  excludedPageKinds: ["tag"],
  blogSlugSuffixes: { "-prefecture-gap": "type:reference" },
  blogSlugInfixes: { "-vs-": "type:paper" },
  noteVerticals: { howto: "type:howto" },
  noteSeries: { A: "type:reference" },
  snsDomains: { ranking: "type:reference" },
  kindle: "type:reference",
};
const input = (over = {}) => ({
  ledger: { rules, assignments: [] },
  pages: [],
  answerPages: new Set(),
  notes: [],
  posts: [],
  books: [],
  ...over,
});

test("規則に当たらない新しいブログ・note・投稿・ページ種別は null のまま返す", () => {
  const m = classifyAll(input({
    pages: [{ id: "new:1", kind: "new", key: "1" }, { id: "blog:essay", kind: "blog", key: "essay" }],
    notes: [{ key: "n", vertical: "unknown" }],
    posts: [{ id: 1, status: "draft", domain: "unknown" }],
  }));
  assert.deepEqual([...m.values()].map((c) => c.type), [null, null, null, null]);
});

test("公開待ちの原稿も型の対象にする", () => {
  const m = classifyAll(input({ draftSlugs: ["a-prefecture-gap", "essay"] }));
  assert.equal(m.get("blog:a-prefecture-gap").type, "type:reference");
  assert.equal(m.get("blog:essay").type, null);
});

test("分析の記事は公開前でも問いへの答えとして論文型になる", () => {
  const m = classifyAll(input({ draftSlugs: ["analysis"], answerPages: new Set(["blog:analysis"]) }));
  assert.equal(m.get("blog:analysis").type, "type:paper");
});

test("個別の指定は規則より強い", () => {
  const m = classifyAll(input({
    ledger: { rules, assignments: [{ id: "blog:a-prefecture-gap", type: "type:howto", reason: "r" }] },
    draftSlugs: ["a-prefecture-gap"],
  }));
  assert.equal(m.get("blog:a-prefecture-gap").type, "type:howto");
});

test("記事を指す投稿は、指している記事より後に判定して型を継ぐ", () => {
  const m = classifyAll(input({
    pages: [{ id: "blog:q", kind: "blog", key: "q" }],
    answerPages: new Set(["blog:q"]),
    posts: [{ id: 1, status: "draft", domain: "blog", content_key: "q" }],
  }));
  assert.equal(m.get("sns:1").type, "type:paper");
});

test("ナビ用のページ・削除した投稿・取り下げた本は対象にしない", () => {
  const m = classifyAll(input({
    pages: [{ id: "tag:t", kind: "tag", key: "t" }],
    posts: [{ id: 2, status: "deleted", domain: "unknown" }],
    books: [{ channel: "kdp", key: "gone", status: "withdrawn" }, { channel: "note", key: "n", status: "published" }],
  }));
  assert.equal(m.size, 0);
});

test("削除した投稿への指定は宛先なしにせず、どこにも無い指定だけを返す", () => {
  const ledger = { assignments: [{ id: "sns:2" }, { id: "blog:gone" }] };
  assert.deepEqual(findStaleAssignments(ledger, new Map(), new Set(["sns:2"])), ["blog:gone"]);
});
