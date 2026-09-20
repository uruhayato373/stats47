import assert from "node:assert/strict";
import test from "node:test";
import {
  applyNavigationFooter,
  collapseDuplicateFooterHeadings,
  applyPublishedLinkRepairs,
  applyVisibleNavigationBeforeSeparator,
  assertCleanCardUrl,
  buildNoteProductCardUrl,
  canonicalizeNoteEditorBody,
  externalCard,
  normalizeLegacyStats47Links,
  resolveProductCardText,
} from "../lib/navigation-footer.mjs";

// apps/web/src/features/products/storefront.generated.ts の実商品 (kindle-k-s1-01) と
// packages 側のマガジン名 (s47-economy: 「都道府県ランキング｜家計・所得・物価」) は別物。
// 是正対象のバグは productTitle にマガジン名が入ってしまうことなので、実商品側の値を
// 直接ハードコードせず「実商品の値であること」「マガジン名でないこと」の両方を確認する。
const REAL_PRODUCT_TARGET = "/products/kindle-k-s1-01";
const WRONG_MAGAZINE_DERIVED_TITLE = "都道府県ランキング｜家計・所得・物価の商品・書籍";
const WRONG_GENERIC_DESCRIPTION = "無料の数値に加え、テーマ別に編集したKindle本または再利用しやすいデータ集を確認できます。";

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

test("resolveProductCardText resolves the real storefront record, not a magazine-derived placeholder", () => {
  const result = resolveProductCardText(REAL_PRODUCT_TARGET);
  assert.equal(typeof result.title, "string");
  assert.equal(typeof result.description, "string");
  assert.ok(result.title.length > 0 && result.description.length > 0);
  // 旧バグの生成規則 (`${マガジン名}の商品・書籍`) の形と一致しないことを確認する。
  assert.doesNotMatch(result.title, /の商品・書籍$/);
  assert.notEqual(result.title, WRONG_MAGAZINE_DERIVED_TITLE);
  assert.notEqual(result.description, WRONG_GENERIC_DESCRIPTION);
});

test("resolveProductCardText fails fast when the productTarget path is malformed", () => {
  assert.throws(
    () => resolveProductCardText(`${REAL_PRODUCT_TARGET}?utm_source=note`),
    /商品導線pathが不正/,
  );
});

test("resolveProductCardText fails fast when no storefront product matches the slug", () => {
  assert.throws(
    () => resolveProductCardText("/products/this-slug-does-not-exist"),
    /商品ストアに productTarget が見つかりません/,
  );
});

test("regenerate-card repair is idempotent once the card already shows the real product text", () => {
  const { title, description } = resolveProductCardText(REAL_PRODUCT_TARGET);
  const url = "https://stats47.jp/products/kindle-k-s1-01/from/note/n023501038bd5";
  const correctBody = `<p>本文</p>${externalCard(url, title, description, ids())}`;
  const result = applyPublishedLinkRepairs(
    correctBody,
    [{ mode: "regenerate-card", fromUrl: url, title, description }],
    { idFactory: ids() },
  );
  assert.equal(result.changed, false);
  assert.equal(result.body, correctBody);
  assert.equal(result.repairs[0].changed, false);
});

test("regenerate-card repair rewrites a magazine-derived wrong title while keeping the external-article card", () => {
  const { title, description } = resolveProductCardText(REAL_PRODUCT_TARGET);
  const url = "https://stats47.jp/products/kindle-k-s1-01/from/note/n023501038bd5";
  const wrongBody = `<p>本文</p>${externalCard(url, WRONG_MAGAZINE_DERIVED_TITLE, WRONG_GENERIC_DESCRIPTION, ids())}`;
  const result = applyPublishedLinkRepairs(
    wrongBody,
    [{ mode: "regenerate-card", fromUrl: url, title, description }],
    { idFactory: ids() },
  );
  assert.equal(result.changed, true);
  assert.match(result.body, /embedded-service="external-article"/);
  assert.doesNotMatch(result.body, /家計・所得・物価の商品・書籍/);
  assert.match(result.body, new RegExp(title.replace(/[.*+?^${}()|[\]\\—]/g, "\\$&")));
});

test("regenerate-card repair is a no-op when the target card is absent from the body (本文差し替え直後など、新規追加は applyNavigationFooter に委ねる)", () => {
  const { title, description } = resolveProductCardText(REAL_PRODUCT_TARGET);
  const body = "<p>関係ないカードだけの本文</p>";
  const result = applyPublishedLinkRepairs(
    body,
    [{
      mode: "regenerate-card",
      fromUrl: "https://stats47.jp/products/kindle-k-s1-01/from/note/n023501038bd5",
      title,
      description,
    }],
  );
  assert.strictEqual(result.body, body);
  assert.strictEqual(result.changed, false);
});

test("footer adds the magazine's paid dataset card and does not duplicate an existing 次に読む heading", () => {
  const datasetPlan = {
    ...plan,
    datasets: [{
      noteUrl: "https://note.com/stats47/n/na416c57e461c",
      noteKey: "na416c57e461c",
      lead: "「教育費は8.7倍違う」で、この記事の元データを配布しています。",
    }],
  };
  const first = applyNavigationFooter("<p>本文</p>", datasetPlan, { idFactory: ids() });
  assert.equal(first.addedDataset, true);
  assert.match(first.body, /data-src="https:\/\/note\.com\/stats47\/n\/na416c57e461c"/);
  assert.match(first.body, /この記事の元データを手元で使う/);
  assert.equal((first.body.match(/次に読む<\/h2>/g) || []).length, 1);

  // 既に next/magazine/site/product のフッターを持つ公開記事へ dataset 枠だけを後から足す
  const existing = applyNavigationFooter("<p>本文</p>", plan, { idFactory: ids() });
  const added = applyNavigationFooter(existing.body, datasetPlan, { idFactory: ids() });
  assert.equal(added.changed, true);
  assert.equal(added.addedDataset, true);
  assert.equal(added.addedNextNote, false);
  assert.equal((added.body.match(/次に読む<\/h2>/g) || []).length, 1, "見出しを二重に作らない");
  assert.equal((added.body.match(/<hr\b/g) || []).length, 1);
  const again = applyNavigationFooter(added.body, datasetPlan, { idFactory: ids() });
  assert.equal(again.changed, false, "dataset 枠も冪等");
});

test("a body that already carries a 深掘り card to a different article does not get a second one", () => {
  const first = applyNavigationFooter("<p>本文</p>", plan, { idFactory: ids() });
  const repick = { ...plan, nextNoteUrl: "https://note.com/stats47/n/nffffffffffff", nextNoteKey: "nffffffffffff" };
  const second = applyNavigationFooter(first.body, repick, { idFactory: ids() });
  assert.equal(second.changed, false);
  assert.equal((second.body.match(/もう一歩深掘りする/g) || []).length, 1);
  assert.equal(second.addedNextNote, false);
});

test("duplicated 次に読む headings collapse to one while every card is kept", () => {
  const first = applyNavigationFooter("<p>本文</p>", { ...plan, productUrl: null }, { idFactory: ids() });
  // 09-16 の一括追加を模す: 2 つ目のフッター見出し + 商品カード
  const doubled = applyNavigationFooter(first.body, { productUrl: plan.productUrl, productTitle: plan.productTitle, productDescription: plan.productDescription }, { idFactory: ids() });
  // 当時の実装はここで 2 個目の <hr><h2> を積んだ。今は 1 個に畳まれるので、擬似的に二重化した本文を作る
  const legacy = doubled.body.replace(/(<p name="[^"]+" id="[^"]+"><strong>このテーマをまとめて読む・使う)/, '<p name="x" id="x"><br></p><hr name="y" id="y"><h2 name="z" id="z">次に読む</h2>$1');
  assert.equal((legacy.match(/次に読む<\/h2>/g) || []).length, 2);
  const fixed = collapseDuplicateFooterHeadings(legacy);
  assert.equal((fixed.match(/次に読む<\/h2>/g) || []).length, 1);
  assert.equal((fixed.match(/<hr\b/g) || []).length, 1);
  assert.equal((fixed.match(/embedded-service="(?:note|external-article)"/g) || []).length, (legacy.match(/embedded-service="(?:note|external-article)"/g) || []).length, "カードは 1 枚も消えない");
  const viaFooter = applyNavigationFooter(legacy, { productUrl: plan.productUrl, productTitle: plan.productTitle, productDescription: plan.productDescription }, { idFactory: ids() });
  assert.equal(viaFooter.changed, true);
  assert.equal(viaFooter.dedupedFooterHeading, true);
  assert.equal(applyNavigationFooter(viaFooter.body, {}, { idFactory: ids() }).changed, false, "畳んだ後は冪等");
});

test("legacy free preview with a duplicated footer heading is collapsed across the whole body without extending it", () => {
  const visible = '<p name="a" id="a">本文</p><hr name="h1" id="h1"><h2 name="t1" id="t1">次に読む</h2><p name="c1" id="c1">カード1</p><p name="x" id="x"><br></p><hr name="h2" id="h2"><h2 name="t2" id="t2">次に読む</h2><p name="c2" id="c2">カード2</p>';
  const hidden = '<p name="sep" id="sep">試し読みの続き</p>';
  const result = applyVisibleNavigationBeforeSeparator(visible + hidden, visible, "sep", {}, { idFactory: ids() });
  assert.equal(result.changed, true);
  assert.equal((result.body.match(/次に読む<\/h2>/g) || []).length, 1);
  assert.ok(result.body.endsWith(hidden), "境界より後ろは触らない");
  assert.ok(result.body.includes("カード1") && result.body.includes("カード2"));
});

test("regenerate-card leaves a correctly-addressed card alone when note returned it without any text", () => {
  const url = "https://stats47.jp/products/kindle-k-s1-01/from/note/n68f5e09c8d62";
  const stripped = `<figure name="f" id="f" data-src="${url}" data-identifier="null" embedded-service="external-article" embedded-content-key="emb1">\n<a href="${url}" rel="nofollow noopener" target="_blank"></a>\n</figure>`;
  const result = applyPublishedLinkRepairs(stripped, [{ mode: "regenerate-card", fromUrl: url, title: "実質手取りの地図", description: "説明" }]);
  assert.equal(result.changed, false);
  assert.equal(result.body, stripped);
});
