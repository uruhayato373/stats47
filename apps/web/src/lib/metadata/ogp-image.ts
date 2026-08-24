/**
 * 静的 OGP 画像 (R2 事前生成) の URL 解決。
 *
 * OGP 画像は Node/CI で Satori レンダリングして R2 に事前保存し、配信時は静的 URL を
 * 参照する (完全DBレス / R2 snapshot 方針に統一)。ランタイムの next/og ImageResponse は
 * Cloudflare Worker で例外を投げる (error 1101) ため使わない。
 * 正典: `.claude/rules/ogp-image-standards.md`。
 *
 * 生成: `apps/web/scripts/generate-ogp-images.ts` (ranking/areas) /
 *        `apps/web/scripts/generate-blog-thumbnails-cloud.ts` (blog、`ogp/ogp.png`)。
 */

const R2_PUBLIC_URL =
  process.env.NEXT_PUBLIC_R2_PUBLIC_URL || "https://storage.stats47.jp";

/** サイト内ブログサムネイルの表示比率。生成契約は640×336（40:21）。 */
export const BLOG_THUMBNAIL_ASPECT_CLASS = "aspect-[40/21]";

/** stable R2 keyの旧bytesを掴まないためのblog card表示版。 */
export const BLOG_THUMBNAIL_CACHE_VERSION = "20260822-v3";

/** R2 キー (先頭スラッシュ無し) から静的 OGP 画像の絶対 URL を作る。 */
export function ogpImageUrl(r2Key: string): string {
  return `${R2_PUBLIC_URL}/${r2Key}`;
}

export function blogThumbnailUrl(
  slug: string,
  variant: "light" | "dark",
): string {
  const key = `app/blog/${slug}/thumbnail-${variant}.webp`;
  return `${ogpImageUrl(key)}?v=${BLOG_THUMBNAIL_CACHE_VERSION}`;
}

export const ogpImageKeys = {
  blog: (slug: string) => `app/blog/${slug}/ogp/ogp.png`,
  ranking: (rankingKey: string) => `app/ranking/${rankingKey}/ogp/ogp.png`,
  area: (areaCode: string) => `app/areas/${areaCode}/ogp/ogp.png`,
} as const;
