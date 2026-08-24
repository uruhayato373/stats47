const test = require("node:test");
const assert = require("node:assert/strict");

const {
  normalizeInspectionUrl,
  rotateDaily,
  todayInTokyo,
  uniqueNormalizedUrls,
} = require("../url-inspection-daily.cjs");

test("URL Inspection 前に fragment を除去する", () => {
  assert.equal(
    normalizeInspectionUrl("https://stats47.jp/blog/example#section"),
    "https://stats47.jp/blog/example",
  );
});

test("query は検査対象 URL の一部として保持する", () => {
  assert.equal(
    normalizeInspectionUrl("https://stats47.jp/search?q=test#results"),
    "https://stats47.jp/search?q=test",
  );
});

test("URL でない入力は除外する", () => {
  assert.equal(normalizeInspectionUrl(""), null);
  assert.equal(normalizeInspectionUrl("not-a-url"), null);
});

test("fragment 除去後に重複排除して quota を使う", () => {
  assert.deepEqual(
    uniqueNormalizedUrls([
      "https://stats47.jp/blog/a#one",
      "https://stats47.jp/blog/a#two",
      "https://stats47.jp/blog/b",
    ]),
    ["https://stats47.jp/blog/a", "https://stats47.jp/blog/b"],
  );
});

test("日次ローテーションは上限を守り、翌日は別区間を返す", () => {
  const items = ["a", "b", "c", "d", "e"];
  const first = rotateDaily(items, 2, "2026-08-24");
  const next = rotateDaily(items, 2, "2026-08-25");
  assert.equal(first.length, 2);
  assert.equal(next.length, 2);
  assert.notDeepEqual(first, next);
  assert.equal(rotateDaily(items, 2).length, 2);
});

test("日次ファイルの日付は Asia/Tokyo を使う", () => {
  assert.equal(todayInTokyo(new Date("2026-08-23T21:30:00.000Z")), "2026-08-24");
});
