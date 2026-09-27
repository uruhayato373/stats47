import assert from "node:assert/strict";
import test from "node:test";

import type { AreaHighlight } from "../../../../packages/area-profile/src/highlights/select-area-highlights.ts";
import {
  buildCoverHook,
  buildCoverTeaser,
  buildScopeNote,
  extractYear,
  normalizePrefCode,
  toAreaCarouselItem,
  validateGroup,
} from "../lib/ig-area-props.ts";

// 選定 (順位しきい値・重複排除・並べ順) のテストは packages/area-profile の
// select-area-highlights.test.ts にある。ここは SNS 固有の整形だけを検証する。

function highlight(overrides: Partial<AreaHighlight>): AreaHighlight {
  return {
    rankingKey: "sample-key",
    label: "サンプル指標",
    value: 100,
    unit: "円",
    rank: 1,
    year: "2024年",
    yearNumber: 2024,
    category: "economy",
    source: "社会・人口統計体系",
    isKakei: false,
    direction: "top",
    tone: "neutral",
    ...overrides,
  };
}

test("buildScopeNote は東京都区部を特別扱いし、他県は補足括弧を除いた市名を使う", () => {
  assert.equal(buildScopeNote("13", "東京 (新宿区)"), "東京都区部の値");
  assert.equal(buildScopeNote("46", "鹿児島市"), "県庁所在市（鹿児島市）の値");
});

test("toAreaCarouselItem は subtitle を raw のまま出し、家計調査にだけ scopeNote を付ける", () => {
  const item = toAreaCarouselItem(
    highlight({
      rankingKey: "foreign-resident-count-per-100k",
      label: "外国人人口（総数・人口10万人当たり）",
      subtitle: "総数（人口10万人当たり）",
    }),
    "県庁所在市（鹿児島市）の値",
  );
  assert.equal(item.label, "外国人人口（総数・人口10万人当たり）");
  assert.equal(item.subtitle, "総数（人口10万人当たり）");
  assert.equal(item.year, 2024);
  assert.equal(item.scopeNote, undefined);

  const kakeiItem = toAreaCarouselItem(highlight({ rankingKey: "engel-coefficient", isKakei: true }), "県庁所在市（鹿児島市）の値");
  assert.equal(kakeiItem.scopeNote, "県庁所在市（鹿児島市）の値");
});

test("buildCoverHook / buildCoverTeaser は新しい文言と最良順位のテーサーを作る", () => {
  assert.equal(buildCoverHook("鹿児島県"), "鹿児島県、全国で何位？");
  const items = [
    toAreaCarouselItem(highlight({ rankingKey: "rank5", label: "5位項目", rank: 5 }), ""),
    toAreaCarouselItem(highlight({ rankingKey: "rank1", label: "1位項目", rank: 1 }), ""),
  ];
  const teaser = buildCoverTeaser(items);
  assert.equal(teaser?.rankingKey, "rank1");
  assert.equal(buildCoverTeaser([]), undefined);
});

test("グループの件数が3件未満なら fail-closed のエラーを返す", () => {
  const two = ["a", "b"].map((k) => toAreaCarouselItem(highlight({ rankingKey: k }), ""));
  assert.ok(validateGroup("全国トップクラス", two).some((e) => e.includes("件数不足")));
  const three = ["a", "b", "c"].map((k) => toAreaCarouselItem(highlight({ rankingKey: k }), ""));
  assert.deepEqual(validateGroup("全国トップクラス", three), []);
});

test("source や year が欠けた項目は fail-closed のエラーを返す", () => {
  const items = [
    toAreaCarouselItem(highlight({ source: "" }), ""),
    toAreaCarouselItem(highlight({ yearNumber: Number.NaN }), ""),
    toAreaCarouselItem(highlight({ rankingKey: "c" }), ""),
  ];
  const errors = validateGroup("全国トップクラス", items);
  assert.ok(errors.some((e) => e.includes("source")));
  assert.ok(errors.some((e) => e.includes("year")));
});

test("extractYear は先頭4桁の年を読み、読めなければ例外", () => {
  assert.equal(extractYear("2020年度"), 2020);
  assert.throws(() => extractYear("不明"));
});

test("normalizePrefCode は2桁/5桁のどちらも受け付け、範囲外は例外", () => {
  assert.deepEqual(normalizePrefCode("46"), { pref2: "46", pref5: "46000" });
  assert.deepEqual(normalizePrefCode("46000"), { pref2: "46", pref5: "46000" });
  assert.throws(() => normalizePrefCode("99"));
  assert.throws(() => normalizePrefCode("abc"));
});
