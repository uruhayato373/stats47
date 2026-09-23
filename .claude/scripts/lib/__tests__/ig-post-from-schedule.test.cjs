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
