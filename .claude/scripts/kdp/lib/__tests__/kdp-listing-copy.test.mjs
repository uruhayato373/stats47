import assert from "node:assert/strict";
import test from "node:test";

import {
  LISTING_DATA_BLOCK,
  auditListingCopy,
  hasCurrentReview,
  renderListingDescription,
  restrictedDescriptionIssues,
} from "../kdp-listing-copy.mjs";

const listing = { id: "K-A", title: "食卓の地図", subtitle: null, epubPath: "a.epub", replacesAsin: null, previousEditions: [] };
const facts = { figures: 11, fullTables: 6, epubPath: "a.epub" };
const copy = (over = {}) => ({
  hook: "「うちの県は消費量が日本一」と聞いても、それが本当に食卓の習慣なのか分からない。そんなときに数字で確かめるための一冊です。",
  points: ["支出額と購入数量の違いが分かり、値の大きさを正しく読める", "県庁所在市の調査の範囲が分かり、県全体と混同しなくなる", "生産地と消費地を分けて、名産の話を数字で説明できる"],
  forWhom: ["地元の食文化を人に説明したい方", "家計調査を読み始めた方"],
  keywords: ["都道府県", "家計調査", "県民性", "消費量", "食文化", "ご当地グルメ", "地域差"],
  targetQueries: ["家計調査", "食文化 都道府県", "県民性"],
  ...over,
});
const entry = (id, c, l = listing, f = facts) => ({ id, listing: { ...l, id }, copy: c, facts: f, description: renderListingDescription(c, f) });
const audit = (c, l, f, text) => auditListingCopy("K-A", [entry("K-A", c, l, f)], text).errors;

test("規則を満たす原稿は通り、図と全県表の実測が紹介文に入る", () => {
  const description = renderListingDescription(copy(), facts);
  assert.match(description, /図 11 点、47 都道府県の全県表 6 表/);
  assert.deepEqual(audit(copy()), []);
});

test("KDP が受け付けない内容を止める", () => {
  assert.ok(restrictedDescriptionIssues("姉妹サイト stats47.jp でご覧いただけます").some((m) => m.includes("URL")));
  assert.ok(restrictedDescriptionIssues("ぜひレビューをお願いします").length > 0);
  assert.ok(restrictedDescriptionIssues("今なら無料で読めます").length > 0);
  assert.ok(restrictedDescriptionIssues("ベストセラーの一冊").length > 0);
  assert.ok(restrictedDescriptionIssues("価格は500円です").length > 0);
  assert.deepEqual(restrictedDescriptionIssues("光熱・水道の価格水準が県でどう違うか"), [], "統計の価格指数は本の値段ではない");
  assert.deepEqual(restrictedDescriptionIssues("Previously published as a.jp by stats47.\n\n読者の悩みから始めます"), []);
});

test("定型文の書き出しは止める", () => {
  const errors = audit(copy({ hook: "本書は家計調査の品目別支出と購入数量を区別して読むための本で、対象世帯と年を確かめます。分かりやすく整理します。" }));
  assert.ok(errors.some((m) => m.includes("読者の悩み")));
});

test("新版は冒頭の免責文が無ければ止める", () => {
  const predecessor = { asin: "B000000001", title: "旧題", author: "stats47" };
  const l = { ...listing, replacesAsin: predecessor.asin, previousEditions: [predecessor] };
  const without = { id: "K-A", listing: { ...l, id: "K-A" }, copy: copy(), facts, description: renderListingDescription(copy(), facts) };
  assert.ok(auditListingCopy("K-A", [without]).errors.some((m) => m.includes("旧版の刊行情報")));
  const withIt = { ...without, description: renderListingDescription(copy(), facts, "Previously published as 旧題 by stats47.") };
  assert.deepEqual(auditListingCopy("K-A", [withIt]).errors, []);
});

test("収録内容は実測と一致し、版がずれた実測は使わない", () => {
  const stale = { id: "K-A", listing, copy: copy(), facts: { ...facts, figures: 12 }, description: renderListingDescription(copy(), facts) };
  assert.ok(auditListingCopy("K-A", [stale]).errors.some((m) => m.includes("実測と一致しない")));
  assert.ok(audit(copy(), listing, { ...facts, epubPath: "old.epub" }).some((m) => m.includes("版が台帳")));
});

test("冊間で同じ文を使い回すと止める", () => {
  const a = copy();
  const b = copy({ hook: "別の本の読者の悩みから始める文章です。自分の県の位置が分からない人のために書きました。" });
  const errors = auditListingCopy("K-A", [entry("K-A", a), entry("K-B", b)]).errors;
  assert.ok(errors.some((m) => m.includes("K-B と同じ文")));
});

test("キーワードは 7 枠を埋め、題名と重ねず、宣伝語を入れず、本文にある語だけを使う", () => {
  assert.ok(audit(copy({ keywords: ["都道府県", "家計調査"] })).some((m) => m.includes("7 枠")));
  assert.ok(audit(copy({ keywords: ["食卓の地図", "家計調査", "県民性", "消費量", "食文化", "ご当地", "地域差"] })).some((m) => m.includes("題名")));
  assert.ok(audit(copy({ keywords: ["おすすめ本", "家計調査", "県民性", "消費量", "食文化", "ご当地", "地域差"] })).some((m) => m.includes("宣伝語")));
  const text = "都道府県 家計調査 県民性 消費量 食文化 ご当地グルメ";
  assert.ok(audit(copy(), listing, facts, text).some((m) => m.includes("本文に無い語") && m.includes("地域差")));
  assert.deepEqual(audit(copy(), listing, facts, `${text} 地域差`), []);
});

test("EPUB が無いときは本文照合を未検査として記録する", () => {
  assert.deepEqual(auditListingCopy("K-A", [entry("K-A", copy())]).skipped, ["キーワードの本文照合 (EPUB が無い)"]);
  assert.equal(LISTING_DATA_BLOCK.includes("公認"), true);
});

test("本文との照合は今の EPUB に対するものだけを有効にする", () => {
  const facts2 = { epubSha256: "a".repeat(64) };
  assert.equal(hasCurrentReview({ review: { epubSha256: "a".repeat(64) } }, facts2), true);
  assert.equal(hasCurrentReview({ review: { epubSha256: "b".repeat(64) } }, facts2), false);
  assert.equal(hasCurrentReview({}, facts2), false);
});
