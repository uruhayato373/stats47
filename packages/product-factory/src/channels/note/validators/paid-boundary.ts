/**
 * paid-boundary validator (仕様 §7・§10・§13)。
 * 無料記事に有料添付が混入しないこと、有料記事の価格が妥当なこと、添付が実在商品を指すこと、
 * 添付商品が未検証なら販売添付を保留 (warning) することを検査する。
 */
import type { NoteIssue } from "./types";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { isValidPaidPrice } from "../pricing";
import { ALL_PRODUCTS } from "../../../catalog/products";
import type { ProductDefinition, ProductStatus } from "../../../catalog/types";

/** 販売添付を許可する商品ライフサイクル (仕様 §10: reviewed / approved のみ)。 */
const ATTACHABLE_STATUS: ReadonlySet<ProductStatus> = new Set<ProductStatus>(["reviewed", "approved"]);

export function checkPaidBoundary(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): { errors: NoteIssue[]; warnings: NoteIssue[] } {
  const errors: NoteIssue[] = [];
  const warnings: NoteIssue[] = [];

  const byId = new Map<string, ProductDefinition>(products.map((p) => [p.id, p]));

  for (const article of articles) {
    if (article.access === "free") {
      // 無料記事は価格 0。有料添付を持たない (attachment は member から派生し、free では空になる想定)。
      if (article.priceJpy !== 0) {
        errors.push({
          code: "free-article-priced",
          ref: article.slug,
          message: `無料記事 ${article.slug} に価格 ${article.priceJpy} が付いている`,
        });
      }
      continue;
    }

    // 有料記事: 価格が有効 tier 内 (仕様 §9)。
    if (!isValidPaidPrice(article.priceJpy)) {
      errors.push({
        code: "paid-price-out-of-tier",
        ref: article.slug,
        message: `有料記事 ${article.slug} の価格 ${article.priceJpy} がどの価格帯にも収まらない`,
      });
    }

    // 添付 (= member) が実在商品を指し、未検証なら販売添付を保留 (warning)。
    for (const pid of article.memberProductIds) {
      const p = byId.get(pid);
      if (!p) {
        errors.push({
          code: "attachment-not-found",
          ref: article.slug,
          message: `添付対象 ${pid} が実在しない`,
        });
        continue;
      }
      if (!ATTACHABLE_STATUS.has(p.status)) {
        warnings.push({
          code: "attachment-unverified",
          ref: pid,
          message: `添付商品 ${pid} が未検証 (status=${p.status})。ready-to-publish 前に実機検証が必要`,
        });
      }
    }
  }

  return { errors, warnings };
}
