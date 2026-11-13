import type { AdRowCell } from "@/features/ads";
import type { AffiliateCategory } from "@/features/ads/constants/affiliate-category";

import { type Article } from "../types";

import { MDContent } from "./md-content";

interface ArticleRendererProps {
    article: Article;
    slug: string;
    relatedArticleTitles?: Record<string, string>;
    /** 広告の段の計測に送る記事の意図軸。 */
    affiliateVertical?: AffiliateCategory | null;
    /** 広告の段 (AdSense と PR)。最後の 1 段が記事の末尾、残りが本文の h2 の前 */
    adRows?: AdRowCell[][];
}

export function ArticleRenderer({
    article,
    slug,
    relatedArticleTitles,
    affiliateVertical,
    adRows,
}: ArticleRendererProps) {
    return (
        <MDContent
            source={article.content}
            slug={slug}
            relatedArticleTitles={relatedArticleTitles}
            affiliateVertical={affiliateVertical}
            adRows={adRows}
        />
    );
}
