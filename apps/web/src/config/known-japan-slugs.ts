import { listJapanCatalogThemes } from "@stats47/data-configs/geo-scope";

/**
 * `/japan/<slug>` で有効な slug 一覧 (GEO-SCOPE-SEPARATION-01 WP5)。
 *
 * `known-theme-slugs.ts` と同型: JAPAN_CATALOGS (git TS) から動的に導出するため、
 * 新規テーマ追加時は catalog に登録するだけで自動追従する (別ファイルの再生成不要)。
 */
export const KNOWN_JAPAN_SLUGS: ReadonlySet<string> = new Set(
  listJapanCatalogThemes().map((t) => t.themeSlug),
);
