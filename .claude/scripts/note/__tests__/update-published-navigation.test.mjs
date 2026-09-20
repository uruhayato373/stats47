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

function kakeiSource({ datasetPublished = true } = {}) {
  return {
    articles: [
      {
        key: "a-kakei-hokkaido",
        title: "北海道の家計",
        magazine: "mag-kakei",
        isPaid: false,
        noteUrl: "https://note.com/stats47/n/n0000000000a1",
        stats47Targets: ["/areas/01000"],
        nextBestArticle: null,
        publishedLinkRepairs: [],
      },
      {
        key: "d-kakei-dataset",
        title: "教育費は8.7倍違う",
        magazine: "mag-kakei",
        isPaid: true,
        noteUrl: datasetPublished ? "https://note.com/stats47/n/na416c57e461c" : null,
        stats47Targets: [],
        nextBestArticle: null,
        publishedLinkRepairs: [],
      },
      {
        key: "other-free",
        title: "別マガジンの無料記事",
        magazine: "mag-economy",
        isPaid: false,
        noteUrl: "https://note.com/stats47/n/n0000000000b1",
        stats47Targets: [],
        nextBestArticle: null,
        publishedLinkRepairs: [],
      },
    ],
    magazines: [
      { key: "mag-kakei", name: "家計調査の読み方", description: "説明", noteUrl: null, isPaid: false },
      { key: "mag-economy", name: MAGAZINE_NAME, description: "説明", noteUrl: null, isPaid: false },
    ],
  };
}

test("--magazine selects only that magazine's free articles and attaches the paid dataset card", () => {
  const plans = buildPlans(kakeiSource(), new Map(), { magazine: "mag-kakei" });
  assert.deepEqual(plans.map((plan) => plan.article.key), ["a-kakei-hokkaido"], "有料記事と他マガジンは対象外");
  const [plan] = plans;
  assert.equal(plan.footer.datasets.length, 1);
  assert.equal(plan.footer.datasets[0].noteUrl, "https://note.com/stats47/n/na416c57e461c");
  assert.equal(plan.footer.datasets[0].noteKey, "na416c57e461c");
  assert.match(plan.footer.datasets[0].lead, /教育費は8\.7倍違う/);
  assert.equal(plan.footer.magazineUrl, null, "note 上に未作成のマガジンはカード化しない");
});

test("unpublished paid members never become dataset cards", () => {
  const [plan] = buildPlans(kakeiSource({ datasetPublished: false }), new Map(), { magazine: "mag-kakei" });
  assert.deepEqual(plan.footer.datasets, []);
});

test("with more than three paid products the cards are distributed round-robin so every product gets an inbound link", () => {
  const free = ["a", "b", "c"].map((suffix) => ({ key: `f-${suffix}`, title: `f-${suffix}`, magazine: "mag-fiscal", isPaid: false, noteUrl: `https://note.com/stats47/n/n0000000000f${suffix}`, stats47Targets: [], nextBestArticle: null, publishedLinkRepairs: [] }));
  const paid = [1, 2, 3, 4, 5, 6, 7].map((n) => ({ key: `p-${n}`, title: `p-${n}`, magazine: "mag-fiscal", isPaid: true, priceJpy: n === 1 ? 2980 : 200, noteUrl: `https://note.com/stats47/n/n00000000000${n}`, stats47Targets: [], nextBestArticle: null, publishedLinkRepairs: [] }));
  const source = { articles: [...free, ...paid], magazines: [{ key: "mag-fiscal", name: "財政", description: "説明", noteUrl: null, isPaid: false }] };
  const plans = buildPlans(source, new Map(), { magazine: "mag-fiscal" });
  const assigned = plans.map((plan) => plan.footer.datasets.map((dataset) => dataset.noteKey));
  assert.equal(new Set(assigned.flat()).size, 7, "7 商品すべてがどこかの無料記事に載る");
  assert.ok(assigned.every((list) => list.length <= 3), "無料記事 1 本あたり 3 枚以下");
  assert.equal(assigned[0][0], "n000000000001", "高い商品 (¥2,980) を先頭の無料記事に割り当てる");
});

test("a large free magazine does not put a cheap CSV card on every article (inbound target caps the spread)", () => {
  const free = Array.from({ length: 40 }, (_, i) => ({ key: `f-${String(i).padStart(2, "0")}`, title: "f", magazine: "mag-big", isPaid: false, noteUrl: `https://note.com/stats47/n/n0000000000${i.toString(16).padStart(2, "0")}`, stats47Targets: [], nextBestArticle: null, publishedLinkRepairs: [] }));
  const paid = [1, 2].map((n) => ({ key: `p-${n}`, title: "p", magazine: "mag-big", isPaid: true, priceJpy: 200, noteUrl: `https://note.com/stats47/n/n00000000ff0${n}`, stats47Targets: [], nextBestArticle: null, publishedLinkRepairs: [] }));
  const source = { articles: [...free, ...paid], magazines: [{ key: "mag-big", name: "big", description: "説明", noteUrl: null, isPaid: false }] };
  const plans = buildPlans(source, new Map(), { magazine: "mag-big" });
  const withCards = plans.filter((plan) => plan.footer.datasets.length > 0);
  assert.equal(withCards.length, 10, "2 商品 × 5 本 = 10 本の無料記事にだけ載る");
  const perProduct = new Map();
  for (const plan of plans) for (const d of plan.footer.datasets) perProduct.set(d.noteKey, (perProduct.get(d.noteKey) || 0) + 1);
  assert.deepEqual([...perProduct.values()], [5, 5]);
});

test("a paid magazine (tutorial series) never gets dataset cards", () => {
  const source = kakeiSource();
  source.magazines[0].isPaid = true;
  const [plan] = buildPlans(source, new Map(), { magazine: "mag-kakei" });
  assert.deepEqual(plan.footer.datasets, []);
});
