import assert from "node:assert/strict";
import test from "node:test";
import {
  applyNavigationFooter,
  applyPublishedLinkRepairs,
  applyVisibleNavigationBeforeSeparator,
  assertCleanCardUrl,
  buildNoteProductCardUrl,
  canonicalizeNoteEditorBody,
  normalizeLegacyStats47Links,
} from "../lib/navigation-footer.mjs";

const plan = {
  nextNoteUrl: "https://note.com/stats47/n/n023501038bd5",
  nextNoteKey: "n023501038bd5",
  nextNoteLead: "日照時間の差が生まれる理由を地形から読み解きます。",
  magazineUrl: "https://note.com/stats47/m/me574f67ac47f",
  magazineName: "都道府県ランキング｜気候・自然",
  magazineDescription: "気候と自然の地域差をまとめています。",
  siteUrl: "https://stats47.jp/ranking/annual-sunshine-duration",
  siteTitle: "年間日照時間の都道府県データ",
  siteDescription: "47都道府県の順位とグラフを確認できます。",
  productUrl: "https://stats47.jp/products/kindle-k-s1-01",
  productTitle: "実質手取りの地図",
  productDescription: "同じテーマをKindle本でまとめて読めます。",
};

function ids() {
  let count = 0;
  return () => `00000000-0000-4000-8000-${String(++count).padStart(12, "0")}`;
}

test("clean note URL accepts a query-free HTTPS card URL", () => {
  assert.equal(
    assertCleanCardUrl("https://note.com/stats47/n/n023501038bd5", "note.com"),
    "https://note.com/stats47/n/n023501038bd5",
  );
});

test("card URL rejects query attribution because note cards require clean URLs", () => {
  assert.throws(
    () => assertCleanCardUrl("https://note.com/stats47/n/n023501038bd5?utm_source=note", "note.com"),
    /query\/hash/,
  );
});

test("product card encodes article attribution in a clean path", () => {
  assert.equal(
    buildNoteProductCardUrl(
      "/products/kindle-k-s1-02",
      "https://note.com/stats47/n/n68f5e09c8d62",
    ),
    "https://stats47.jp/products/kindle-k-s1-02/from/note/n68f5e09c8d62",
  );
  assert.throws(() =>
    buildNoteProductCardUrl(
      "/products/kindle-k-s1-02?utm_source=note",
      "https://note.com/stats47/n/n68f5e09c8d62",
    ),
  );
});

test("footer adds note, magazine, site and product cards without UTM", () => {
  const result = applyNavigationFooter("<p>本文</p>", plan, { idFactory: ids() });
  assert.equal(result.addedNextNote, true);
  assert.equal(result.addedMagazine, true);
  assert.equal(result.addedSite, true);
  assert.equal(result.addedProduct, true);
  assert.match(result.body, /embedded-service="note"/);
  assert.match(result.body, /embedded-service="external-article"/);
  assert.doesNotMatch(result.body, /utm_/);
});

test("an existing stats47 link suppresses a redundant generic site card", () => {
  const result = applyNavigationFooter(
    '<p><a href="https://stats47.jp/ranking/another">既存リンク</a></p>',
    plan,
    { idFactory: ids() },
  );
  assert.equal(result.addedSite, false);
  assert.equal(result.addedProduct, true);
  assert.doesNotMatch(result.body, /annual-sunshine-duration/);
});

test("plain stats47 text is not mistaken for a clickable site link", () => {
  const result = applyNavigationFooter("<p>詳しくは https://stats47.jp を参照</p>", plan, { idFactory: ids() });
  assert.equal(result.addedSite, true);
});

test("footer supports a site-only plan", () => {
  const result = applyNavigationFooter("<p>本文</p>", {
    siteUrl: "https://stats47.jp",
    siteTitle: "統計で見る都道府県",
    siteDescription: "47都道府県のデータを探せます。",
  }, { idFactory: ids() });
  assert.equal(result.addedNextNote, false);
  assert.equal(result.addedMagazine, false);
  assert.equal(result.addedSite, true);
  assert.equal(result.addedProduct, false);
  assert.match(result.body, /<em>stats47\.jp<\/em>/);
});

test("footer application is idempotent for navigation URLs", () => {
  const first = applyNavigationFooter("<p>本文</p>", plan, { idFactory: ids() });
  const second = applyNavigationFooter(first.body, plan, { idFactory: ids() });
  assert.equal(second.changed, false);
  assert.equal(second.body, first.body);
});

test("legacy free preview receives missing navigation before its separator", () => {
  const separator = "11111111-1111-4111-8111-111111111111";
  const publicBody = `<p>公開本文</p><hr name="${separator}" id="${separator}">`;
  const fullBody = `${publicBody}<p>境界後本文</p>`;
  const result = applyVisibleNavigationBeforeSeparator(fullBody, publicBody, separator, plan, { idFactory: ids() });
  assert.equal(result.changed, true);
  assert.ok(result.body.indexOf(plan.nextNoteUrl) < result.body.indexOf(separator));
  assert.match(result.body, /境界後本文/);
});

test("legacy stats47 HTTP links are normalized to HTTPS", () => {
  assert.equal(
    normalizeLegacyStats47Links('<a href="http://stats47.jp/ranking/a">a</a><a href="http://www.stats47.jp/blog">b</a>'),
    '<a href="https://stats47.jp/ranking/a">a</a><a href="https://stats47.jp/blog">b</a>',
  );
});

test("editor-only card metadata drift does not masquerade as an authored draft", () => {
  const published = '<p name="a" id="a"><a href="https://stats47.jp" rel="nofollow" target="_blank">本文</a></p><figure name="b" data-src="https://stats47.jp/ranking/a" embedded-service="external-article"><strong>旧タイトル</strong><em>旧説明</em></figure>';
  const draft = '<p id="c" name="c"><a href="https://stats47.jp" target="_blank" rel="nofollow">本文</a></p><figure id="d" data-src="https://stats47.jp/ranking/a" embedded-content-key="emb1" embedded-service="external-article"><strong>新タイトル</strong><em>新説明</em></figure>';
  assert.equal(canonicalizeNoteEditorBody(published), canonicalizeNoteEditorBody(draft));
});

test("adjacent identical links from the public API equal the editor's merged link", () => {
  const published = '<p><a href="https://stats47.jp/blog/aomori-food-culture">青森県の食</a><a href="https://stats47.jp/blog/aomori-food-culture">卓</a></p>';
  const editor = '<p><a href="https://stats47.jp/blog/aomori-food-culture">青森県の食卓</a></p>';
  assert.equal(canonicalizeNoteEditorBody(published), canonicalizeNoteEditorBody(editor));
});

test("published link repair replaces every exact legacy URL", () => {
  const result = applyPublishedLinkRepairs(
    '<p><a href="https://stats47.jp/ranking/population">人口</a></p>',
    [{
      mode: "replace-url",
      fromUrl: "https://stats47.jp/ranking/population",
      toUrl: "https://stats47.jp/ranking/total-population",
    }],
  );
  assert.equal(result.changed, true);
  assert.doesNotMatch(result.body, /ranking\/population/);
  assert.match(result.body, /ranking\/total-population/);
});

test("published card repair removes stale embed metadata and keeps a clean link", () => {
  const result = applyPublishedLinkRepairs(
    '<h3 name="h" id="h">バイオマス発電施設数</h3><figure name="f" id="f" data-src="https://stats47.jp/ranking/biomass-power-station-count" embedded-service="external-article"><a href="https://stats47.jp/ranking/biomass-power-station-count">old</a></figure>',
    [{
      mode: "replace-card",
      fromUrl: "https://stats47.jp/ranking/biomass-power-station-count",
      toUrl: "https://stats47.jp/category/energy",
      linkText: "エネルギー・水の都道府県データをもっと見る",
      headingFrom: "バイオマス発電施設数",
      headingTo: "関連するエネルギーデータ",
    }],
  );
  assert.doesNotMatch(result.body, /biomass-power-station-count|embedded-service/);
  assert.match(result.body, /関連するエネルギーデータ/);
  assert.match(result.body, /href="https:\/\/stats47\.jp\/category\/energy"/);
});
