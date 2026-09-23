const assert = require("node:assert/strict");
const test = require("node:test");

const { carouselUrlsFor, ledgerPostTypeFor } = require("../../instagram/post-from-schedule.cjs");

const R2 = "https://storage.stats47.jp";
const slides = [
  "slide-1-question-1080x1350.png",
  "slide-2-hint-1080x1350.png",
  "slide-3-answer-1080x1350.png",
  "slide-4-table-1080x1350.png",
  "slide-5-outro-1080x1350.png",
];
const entry = {
  date: "2026-09-28",
  time: "12:00",
  type: "carousel",
  domain: "ranking-quiz",
  content_key: "shochu-consumption-expenditure",
  slides,
};

test("カルーセルの子画像は slides の順に stills/ 直下の公開 URL へ解決する", () => {
  const urls = carouselUrlsFor(entry);
  assert.equal(urls.length, 5);
  assert.equal(
    urls[0],
    `${R2}/sns/ranking-quiz/shochu-consumption-expenditure/instagram/stills/slide-1-question-1080x1350.png`,
  );
  assert.ok(urls[4].endsWith("/slide-5-outro-1080x1350.png"), "表示順を入れ替えない");
});

test("slides が 1 枚以下・11 枚以上なら Graph API に送る前に止める", () => {
  assert.throws(() => carouselUrlsFor({ ...entry, slides: [slides[0]] }), /2〜10 件/);
  assert.throws(() => carouselUrlsFor({ ...entry, slides: undefined }), /2〜10 件/);
  const eleven = Array.from({ length: 11 }, (_, i) => `slide-${i + 1}.png`);
  assert.throws(() => carouselUrlsFor({ ...entry, slides: eleven }), /2〜10 件/);
});

test("stills/ の外や別コンテンツを指すファイル名は拒否する", () => {
  for (const bad of ["../slide-1.png", "sub/slide-1.png", "slide-1.gif", ".hidden.png", "https://x/y.png"]) {
    assert.throws(() => carouselUrlsFor({ ...entry, slides: [bad, slides[1]] }), /stills\/ 直下/, bad);
  }
});

test("同じ画像の重複は並べ間違いとして拒否する", () => {
  assert.throws(() => carouselUrlsFor({ ...entry, slides: [slides[0], slides[0]] }), /重複/);
});

test("台帳の post_type はカルーセルだけ carousel、既存の単枚・リールは従来の original のまま", () => {
  assert.equal(ledgerPostTypeFor(entry), "carousel");
  assert.equal(ledgerPostTypeFor({ type: "image" }), "original");
  assert.equal(ledgerPostTypeFor({ type: "reels" }), "original");
  assert.equal(ledgerPostTypeFor({}), "original");
});

const { selectDueEntry, shiftDate } = require("../../instagram/post-from-schedule.cjs");

const e = (date, time, content_key) => ({ date, time, content_key, type: "carousel", domain: "d" });
const ctx = (nowTime, posted = []) => ({
  today: "2026-09-25",
  yesterday: "2026-09-24",
  nowTime,
  posted: new Set(posted),
});

test("夜枠の cron が日付をまたいで遅れても、前日 19:00 の未投稿を翌 01:24 に拾う", () => {
  const entries = [e("2026-09-24", "19:00", "a"), e("2026-09-25", "19:00", "b")];
  assert.equal(selectDueEntry(entries, ctx("01:24")).next.content_key, "a");
});

test("前日分が投稿済みなら拾わず、当日分は時刻が来るまで出さない", () => {
  const entries = [e("2026-09-24", "19:00", "a"), e("2026-09-25", "19:00", "b")];
  const { next, upcoming } = selectDueEntry(entries, ctx("01:24", ["2026-09-24|a"]));
  assert.equal(next, null);
  assert.deepEqual(upcoming.map((x) => x.content_key), ["b"]);
  assert.equal(selectDueEntry(entries, ctx("19:05", ["2026-09-24|a"])).next.content_key, "b");
});

test("前日分と当日分がどちらも出せるときは前日分を先に出す", () => {
  const entries = [e("2026-09-25", "08:00", "b"), e("2026-09-24", "19:00", "a")];
  assert.equal(selectDueEntry(entries, ctx("09:00")).next.content_key, "a");
});

test("2 日以上前の未投稿は拾わない (古い予約を突然出さない)", () => {
  const entries = [e("2026-09-23", "19:00", "old")];
  assert.equal(selectDueEntry(entries, ctx("23:00")).next, null);
});

test("投稿済みの判定は予約日で行う (実行日で記録すると繰り越し分を二重投稿する)", () => {
  const entries = [e("2026-09-24", "19:00", "a")];
  assert.equal(selectDueEntry(entries, ctx("01:24", ["2026-09-25|a"])).next.content_key, "a");
  assert.equal(selectDueEntry(entries, ctx("01:24", ["2026-09-24|a"])).next, null);
});

test("日付の繰り下げは月・年をまたぐ", () => {
  assert.equal(shiftDate("2026-10-01", -1), "2026-09-30");
  assert.equal(shiftDate("2027-01-01", -1), "2026-12-31");
});
