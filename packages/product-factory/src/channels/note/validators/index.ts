/**
 * note channel validator の統合 (仕様 §13)。
 * coverage / duplication / claims / paid-boundary を実行し、結果を集約する純関数。
 */
import type { NoteIssue, NoteValidationResult } from "./types";
import type { NoteArticlePlan } from "../types";
import { CANONICAL_ARTICLES } from "../article-plan";
import { ALL_PRODUCTS } from "../../../catalog/products";
import type { ProductDefinition } from "../../../catalog/types";
import { checkCoverage } from "./coverage";
import { checkDuplication } from "./duplication";
import { checkClaims } from "./claims";
import { checkPaidBoundary } from "./paid-boundary";

export type { NoteIssue, NoteValidationResult } from "./types";
export { checkCoverage } from "./coverage";
export { checkDuplication } from "./duplication";
export { checkClaims, scanText, BANNED_PHRASES } from "./claims";
export { checkPaidBoundary } from "./paid-boundary";

export interface NoteChannelValidation extends NoteValidationResult {
  /** disposition coverage (割当済み商品数 / 全商品数)。 */
  readonly coverage: { readonly assigned: number; readonly total: number };
  /** canonical 記事数。 */
  readonly articleCount: number;
}

export function validateNoteChannel(
  products: readonly ProductDefinition[] = ALL_PRODUCTS,
  articles: readonly NoteArticlePlan[] = CANONICAL_ARTICLES,
): NoteChannelValidation {
  const errors: NoteIssue[] = [];
  const warnings: NoteIssue[] = [];

  for (const check of [checkCoverage, checkDuplication, checkPaidBoundary]) {
    const r = check(products, articles);
    errors.push(...r.errors);
    warnings.push(...r.warnings);
  }
  const claims = checkClaims(articles);
  errors.push(...claims.errors);
  warnings.push(...claims.warnings);

  const assigned = new Set<string>();
  for (const a of articles) for (const pid of a.memberProductIds) assigned.add(pid);

  return {
    ok: errors.length === 0,
    errors,
    warnings,
    coverage: { assigned: assigned.size, total: products.length },
    articleCount: articles.length,
  };
}
