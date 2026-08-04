/**
 * 記事本文の広告フォーマット A/B (`blog-inbody-format`) の共有定義。
 *
 * ★ **client 境界に置かないこと。** これらは server component (blog の page.tsx) からも
 *   呼ぶため、`"use client"` を持つモジュール (md-content.tsx) に置くと
 *   「Attempted to call pickInBodyAdFormat() from the server but ... is on the client」
 *   で実行時に落ちる (2026-08-04 に E2E が検出。型チェックでは捕まらない)。
 */

/** 本文中の広告フォーマット。`text` はテキストリンク、`banner` は 300x250。 */
export type InBodyAdFormat = "text" | "banner";

/** 本文フォーマット A/B の実験 ID (GA4 experiment_id)。 */
export const IN_BODY_AD_EXPERIMENT_ID = "blog-inbody-format";

/** 本文に差し込むバナー 1 件 (services/resolve-affiliate-ad の ResolvedAffiliateBanner と同形)。 */
export interface InlineAffiliateBanner {
  id: string;
  title: string;
  href: string;
  imageUrl: string;
  trackingPixelUrl: string | null;
  width: number;
  height: number;
  vertical: string | null;
}

/**
 * slug から決定的に A/B を割り当てる。記事ごとに固定なので、同じ記事を再訪した読者に
 * 別フォーマットが出ることはない (計測が混ざらない)。
 * 公開 432 記事での実測分割は text 219 / banner 213。
 */
export function pickInBodyAdFormat(slug: string | undefined): InBodyAdFormat {
  if (!slug) return "text";
  let h = 0;
  for (let i = 0; i < slug.length; i++) h = (h * 31 + slug.charCodeAt(i)) >>> 0;
  return h % 2 === 0 ? "text" : "banner";
}
