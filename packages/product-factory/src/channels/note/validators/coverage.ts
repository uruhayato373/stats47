/**
 * coverage validator (仕様 §2-1・§13)。
 * 現行14パックすべてに disposition があり、記事プランが実在商品だけを参照することを保証する。
 */
import type { NoteIssue } from "./types";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { ALL_PRODUCTS } from "../../../catalog/products";
import type { ProductDefinition } from "../../../catalog/types";

export function checkCoverage(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): { errors: NoteIssue[]; warnings: NoteIssue[] } {
  const errors: NoteIssue[] = [];
  const warnings: NoteIssue[] = [];

  const productIds = new Set(products.map((p) => p.id));
  const assignedTo = new Map<string, string[]>(); // productId → [slug...]
  for (const article of articles) {
    if (article.memberProductIds.length === 0) {
      errors.push({
        code: "article-empty",
        ref: article.slug,
        message: `記事 ${article.slug} に member 商品が無い`,
      });
    }
    for (const pid of article.memberProductIds) {
      if (!productIds.has(pid)) {
        errors.push({
          code: "member-not-found",
          ref: article.slug,
          message: `記事 ${article.slug} が存在しない商品を参照: ${pid}`,
        });
      }
      const list = assignedTo.get(pid) ?? [];
      list.push(article.slug);
      assignedTo.set(pid, list);
    }
  }

  // 全商品が「ちょうど 1 記事」に属する (disposition 100%)。
  for (const p of products) {
    const slugs = assignedTo.get(p.id);
    if (!slugs || slugs.length === 0) {
      errors.push({
        code: "product-unassigned",
        ref: p.id,
        message: `商品 ${p.id} が canonical 記事に未割当 (disposition なし)`,
      });
    }
  }

  return { errors, warnings };
}
