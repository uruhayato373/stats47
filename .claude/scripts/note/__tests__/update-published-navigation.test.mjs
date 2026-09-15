import assert from "node:assert/strict";
import test from "node:test";
import { buildPlans } from "../update-published-navigation.mjs";

// 実カタログの s47-economy マガジンが指す実商品 (kindle-k-s1-01) を模す。
// マガジン名 (誤ったカードが表示していた文言) と実商品タイトルが異なることが前提条件。
const PRODUCT_TARGET = "/products/kindle-k-s1-01";
const MAGAZINE_NAME = "都道府県ランキング｜家計・所得・物価";

function baseSource({ isPaid = false, publishedLinkRepairs = [] } = {}) {
  return {
    articles: [
      {
        key: "article-a",
        title: "記事A",
        magazine: "mag-economy",
        isPaid,
        noteUrl: "https://note.com/stats47/n/n0000000000aa",
        stats47Targets: [],
        nextBestArticle: null,
        publishedLinkRepairs,
      },
    ],
    magazines: [
      {
        key: "mag-economy",
        name: MAGAZINE_NAME,
        description: "マガジンの説明文。",
        noteUrl: "https://note.com/stats47/m/mzzzzzzzzzzzz",
        productTarget: PRODUCT_TARGET,
      },
    ],
  };
}

test("buildPlans resolves productTitle/productDescription from the real storefront record", () => {
  const [plan] = buildPlans(baseSource(), new Map(), { products: true });
  assert.ok(plan.footer, "productTarget を持つ記事は footer が生成されるはず");
  assert.equal(typeof plan.footer.productTitle, "string");
  assert.ok(plan.footer.productTitle.length > 0);
  // 旧バグ: productTitle が `${マガジン名}の商品・書籍` になっていた。
  assert.notEqual(plan.footer.productTitle, `${MAGAZINE_NAME}の商品・書籍`);
  assert.doesNotMatch(plan.footer.productTitle, /の商品・書籍$/);
  assert.ok(
    !plan.footer.productTitle.includes(MAGAZINE_NAME),
    "productTitle にマガジン名がそのまま含まれてはいけない",
  );
});

test("buildPlans auto-adds a regenerate-card repair whenever productTarget resolves, without catalog entries", () => {
  // article.publishedLinkRepairs は空のまま (catalog に手書きしない設計を確認する)。
  const [plan] = buildPlans(baseSource({ publishedLinkRepairs: [] }), new Map(), { products: true });
  const repair = plan.repairs.find((entry) => entry.mode === "regenerate-card");
  assert.ok(repair, "regenerate-card repair が自動的に追加されているはず");
  assert.equal(repair.fromUrl, plan.footer.productUrl);
  assert.equal(repair.title, plan.footer.productTitle);
  assert.equal(repair.description, plan.footer.productDescription);
});

test("buildPlans does not resolve a product card when --products is not requested", () => {
  const [plan] = buildPlans(baseSource(), new Map(), { products: false, allFree: true });
  assert.equal(plan.footer.productUrl, null);
  assert.equal(plan.footer.productTitle, null);
  assert.ok(!plan.repairs.some((entry) => entry.mode === "regenerate-card"));
});
