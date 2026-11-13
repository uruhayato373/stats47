import { JAPAN_THEME_SLUGS } from "@stats47/data-configs/geo-scope/edge-keys";

/**
 * `/japan/<slug>` で有効な slug 一覧 (GEO-SCOPE-SEPARATION-01 WP5)。
 *
 * middleware (Edge) が読むので、全指標 registry を抱える `listJapanCatalogThemes()` ではなく、
 * 台帳 (themes.japan-catalogs / themes.japan-kakei-catalogs) のキーから導く軽い一覧を使う
 * (MIDDLEWARE-REGISTRY-BUNDLE-01)。新規テーマは台帳へ足すだけで自動追従する。
 */
export const KNOWN_JAPAN_SLUGS: ReadonlySet<string> = JAPAN_THEME_SLUGS;
