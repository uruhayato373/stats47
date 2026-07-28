import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";

import { type Article } from "../types";

import { MDContent } from "./md-content";
import { MDXContent } from "./mdx-content";

interface ArticleRendererProps {
    article: Article;
    slug: string;
    relatedArticleTitles?: Record<string, string>;
    affiliateBannersByCategory?: Record<string, {
        id?: string;
        href: string;
        imageUrl: string;
        trackingPixelUrl?: string | null;
        width?: number | null;
        height?: number | null;
        title?: string;
    }>;
    /** 本文中に自動挿入するテキストリンク広告 (記事の tagKeys から解決済み)。 */
    affiliateTextAds?: Array<{
        id: string;
        title: string;
        href: string;
        trackingPixelUrl?: string | null;
    }>;
    /** テキストリンクのテーマ色に使う vertical。 */
    affiliateVertical?: AffiliateCategory | null;
}

export function ArticleRenderer({
    article,
    slug,
    relatedArticleTitles,
    affiliateBannersByCategory,
    affiliateTextAds,
    affiliateVertical,
}: ArticleRendererProps) {
    if (article.format === "mdx") {
        return <MDXContent source={article.content} />;
    }
    return (
        <MDContent
            source={article.content}
            slug={slug}
            relatedArticleTitles={relatedArticleTitles}
            affiliateBannersByCategory={affiliateBannersByCategory}
            affiliateTextAds={affiliateTextAds}
            affiliateVertical={affiliateVertical}
        />
    );
}
