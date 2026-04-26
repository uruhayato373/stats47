/**
 * @deprecated UrlPolicy へ移行済み（Phase 9, 2026-04-26）。
 * 新規コードは `@/lib/url-policy` の UrlPolicy.area を直接使用してください。
 * 本ファイルは互換性のために UrlPolicy から再 export しているのみ。
 */

import { INDEXABLE_AREA_CATEGORIES } from "@/lib/url-policy";

export { INDEXABLE_AREA_CATEGORIES };

export const INDEXABLE_AREA_CATEGORIES_SET = new Set<string>(
  INDEXABLE_AREA_CATEGORIES,
);
