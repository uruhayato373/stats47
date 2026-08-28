/** 本文3枠と記事末尾1枠に必要なバナー解決数。 */
export const BLOG_IN_BODY_BANNER_COUNT = 4;

/** 本文に差し込むバナー1件（広告解決サービスの返却値と同形）。 */
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
