/**
 * canonical 記事プラン (SSOT)。
 *
 * ココナラの商品カタログ (P-01〜P-14) から 1 パック = 1 記事で決定的に導出する。
 * 商品 ID・価格・テーマを別の手書き台帳へ複製しないため、商品追加・変更時は
 * `ALL_PRODUCTS` だけを編集すれば note 側の coverage も追従する。
 */
import { ALL_PRODUCTS } from "../../catalog/products";
import type { PackTheme, ProductDefinition } from "../../catalog/types";
import { SERIES_BY_THEME } from "./series";
import type { NoteArticlePlan, NoteArticleRole } from "./types";

const STATS47_TARGETS: Readonly<Record<PackTheme, readonly string[]>> = {
  "population-household": ["/themes/population-dynamics", "/ranking"],
  "income-wage-hiring": ["/themes/real-income", "/ranking"],
  "tourism-lodging": ["/themes/tourism", "/ranking"],
  "municipal-finance": ["/themes/local-finance", "/ranking"],
  "healthcare-nursing": ["/themes/healthcare", "/ranking"],
  "education-childcare": ["/themes/education-culture", "/ranking"],
  "migration-living": ["/areas", "/compare"],
  "retail-trade-area": ["/themes/local-economy", "/ranking"],
  "industry-economy": ["/themes/local-economy", "/ranking"],
  "disaster-infrastructure": ["/themes/safety", "/ranking"],
  "map-chart-assets": ["/ranking", "/themes"],
  "all-in-one": ["/themes", "/ranking"],
  "free-trial": ["/ranking", "/themes"],
  "household-consumption": ["/themes/consumer-prices", "/ranking"],
};

function articleRole(product: ProductDefinition): NoteArticleRole {
  if (product.theme === "all-in-one") return "pillar";
  if (product.theme === "free-trial") return "sample";
  if (product.theme === "map-chart-assets") return "how-to";
  return "use-case";
}

function articlePrice(product: ProductDefinition): number {
  if (product.theme === "free-trial") return 0;
  // note の既存価格帯 (最大 9,800 円) に収めた提案値。ココナラ価格の SSOT は変更しない。
  return Math.min(9_800, Math.max(500, product.price.initialYen));
}

function priority(product: ProductDefinition): 1 | 2 | 3 {
  return ["P-01", "P-12", "P-13", "P-14"].includes(product.id) ? 1 : 2;
}

export function buildCanonicalArticles(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
): readonly NoteArticlePlan[] {
  return products.map((product) => ({
    slug: `prefecture-${product.theme}-pack`,
    series: SERIES_BY_THEME[product.theme],
    title:
      product.theme === "free-trial"
        ? "都道府県データを無料サンプルで試す方法"
        : `${product.name}の使い方と比較のポイント`,
    role: articleRole(product),
    access: product.theme === "free-trial" ? "free" : "paid",
    priceJpy: articlePrice(product),
    memberProductIds: [product.id],
    stats47Targets: STATS47_TARGETS[product.theme],
    priority: priority(product),
    readerJob: product.jobToBeDone,
    hashtags: ["都道府県", "統計", "データ可視化", product.name.replace(/（.*$/, "")],
  }));
}

export const CANONICAL_ARTICLES: readonly NoteArticlePlan[] = buildCanonicalArticles();
