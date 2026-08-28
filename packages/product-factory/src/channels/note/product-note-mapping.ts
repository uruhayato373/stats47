/**
 * 商品 → note マッピングの決定的導出 (仕様 §6)。
 *
 * CANONICAL_ARTICLES + ALL_PRODUCTS から、現行14パックそれぞれの
 * NoteProductMapping を機械的に組み立てる。手書きの対応表を持たない。
 */
import type { NoteProductMapping, NoteDisposition, NoteArticlePlan } from "./types";
import { CANONICAL_ARTICLES } from "./article-plan";
import { ALL_PRODUCTS } from "../../catalog/products";
import type { ProductDefinition } from "../../catalog/types";

/** 商品テーマと所属記事から disposition を決定的に導出する。 */
export function dispositionFor(product: ProductDefinition, article: NoteArticlePlan): NoteDisposition {
  if (product.theme === "free-trial" || article.access === "free") return "free-lead";
  if (article.access === "paid" && article.memberProductIds.length === 1) return "standalone-paid";
  return "bundle-member";
}

function reasonFor(disposition: NoteDisposition, article: NoteArticlePlan): string {
  switch (disposition) {
    case "standalone-paid":
      return `単独有料記事「${article.title}」の唯一商品`;
    case "bundle-member":
      return `有料記事「${article.title}」に ${article.memberProductIds.length} 商品を束ねた 1 つ`;
    case "free-lead":
      return `無料記事「${article.title}」からココナラ受注・有料商品へ誘導`;
    case "catalog-only":
      return `比較記事「${article.title}」内でのみ扱う (独立記事化しない)`;
  }
}

/** productId → 所属 canonical 記事の索引 (記事プランから機械生成)。 */
export function buildArticleIndex(
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): ReadonlyMap<string, NoteArticlePlan> {
  const index = new Map<string, NoteArticlePlan>();
  for (const article of articles) {
    for (const pid of article.memberProductIds) {
      // 重複は validator (duplication) が検出する。ここでは最初の割当を保持。
      if (!index.has(pid)) index.set(pid, article);
    }
  }
  return index;
}

/**
 * 現行パックの NoteProductMapping を決定的に生成する。
 * 記事に割り当てられていない商品は index に無いため、呼び出し側 (coverage validator) が
 * 未割当として検出できるよう、その商品はスキップせず「未割当」印の記事で返す。
 */
export function buildNoteMappings(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): readonly NoteProductMapping[] {
  const index = buildArticleIndex(articles);
  const mappings: NoteProductMapping[] = [];
  for (const product of products) {
    const article = index.get(product.id);
    if (!article) continue; // coverage validator が未割当を error にする
    const disposition = dispositionFor(product, article);
    const attachmentProductIds = article.access === "paid" ? article.memberProductIds : [];
    mappings.push({
      productId: product.id,
      disposition,
      series: article.series,
      canonicalSlug: article.slug,
      articleRole: article.role,
      access: article.access,
      priceJpy: article.priceJpy,
      attachmentProductIds,
      coconalaProductIds: article.memberProductIds,
      stats47Targets: article.stats47Targets,
      priority: article.priority,
      reason: reasonFor(disposition, article),
    });
  }
  return mappings;
}

/** すぐ使える確定マッピング (既定の catalog + article-plan)。 */
export const NOTE_PRODUCT_MAPPINGS: readonly NoteProductMapping[] = buildNoteMappings();
