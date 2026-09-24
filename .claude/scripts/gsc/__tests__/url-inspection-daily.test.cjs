const test = require("node:test");
const assert = require("node:assert/strict");

const {
  capUrls,
  normalizeInspectionUrl,
  quotasFor,
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

test("CI 既定の 500 件でも是正キューに半分の枠を配る", () => {
  // 2026-09-17〜23: 検索実績上位が先頭 500 件を独占し、是正キューが 0 件しか検査されなかった
  const quota = quotasFor(500);
  assert.equal(quota.remediation, 250);
  assert.ok(quota.observed < quota.remediation);
});

test("capUrls は正規化後の重複を 1 件として数え上限で切る", () => {
  const { urls, collapsed } = capUrls(
    ["https://stats47.jp/a#x", "https://stats47.jp/a", "https://stats47.jp/b", "https://stats47.jp/c"],
    2,
  );
  assert.deepEqual(urls, ["https://stats47.jp/a", "https://stats47.jp/b"]);
  assert.equal(collapsed, 1);
});
