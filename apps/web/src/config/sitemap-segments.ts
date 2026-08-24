/**
 * sitemap の segment 定義 (単一ソース)。
 *
 * ★ここが唯一の定義。`app/sitemap.ts` (各 shard の生成) と
 * `app/sitemap.xml/route.ts` (index) の**両方**がここを読む。
 *
 * ★なぜ切り出したか (2026-08-20 の実測):
 *   以前は index 側が `const SEGMENT_COUNT = 8` とハードコードし、
 *   「追加時は両方を更新」というコメントだけで同期を担保していた。実際には
 *   `cities` (2026-06 追加・1,080 URL) も `japan` (2026-08-20 追加・19 URL) も
 *   index に反映されず、**2 か月以上 Google に提出されていなかった**。
 *   人手の二重管理はコメントでは守られない。
 *
 * ★SEGMENTS の順序を変えると URL (数字 id) が変わる。追加は必ず末尾へ。
 */
export const SITEMAP_SEGMENTS = [
  'static',
  'themes',
  'areas',
  'ranking',
  'blog',
  'categories',
  'surveys',
  'tags',
  'cities',
  // GEO-SCOPE-SEPARATION-01 WP5: 既存 segment の id (配列 index) を変えないため末尾に追記する。
  'japan',
  'municipalities',
] as const;

export type SitemapSegment = (typeof SITEMAP_SEGMENTS)[number];
