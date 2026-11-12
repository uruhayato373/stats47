import type { AdRowCell } from "@/features/ads";
import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";

import { type Article } from "../types";

import { MDContent } from "./md-content";

interface ArticleRendererProps {
    article: Article;
    slug: string;
    relatedArticleTitles?: Record<string, string>;
    /** 本文中に自動挿入するテキストリンク広告 (記事の tagKeys から解決済み)。 */
    affiliateTextAds?: Array<{
        id: string;
        title: string;
        href: string;
        trackingPixelUrl?: string | null;
        /** GA4 `affiliate_vertical` に送る広告自身の意図軸 (解決層が確定させる)。 */
        vertical: AffiliateCategory | null;
    }>;
    /** テキストリンクのテーマ色に使う vertical。 */
    affiliateVertical?: AffiliateCategory | null;
    /** 広告の段 (AdSense と PR)。最後の 1 段が記事の末尾、残りが本文の h2 の前 */
    adRows?: AdRowCell[][];
}

export function ArticleRenderer({
    article,
    slug,
    relatedArticleTitles,
    affiliateTextAds,
    affiliateVertical,
    adRows,
}: ArticleRendererProps) {
    return (
        <MDContent
            source={article.content}
            slug={slug}
            relatedArticleTitles={relatedArticleTitles}
            affiliateTextAds={affiliateTextAds}
            affiliateVertical={affiliateVertical}
            adRows={adRows}
        />
    );
}
