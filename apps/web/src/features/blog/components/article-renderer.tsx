import { type Article } from "../types";

import { MDContent } from "./md-content";
import { MDXContent } from "./mdx-content";

interface ArticleRendererProps {
    article: Article;
    slug: string;
    relatedArticleTitles?: Record<string, string>;
    affiliateBannersByCategory?: Record<string, {
        href: string;
        imageUrl: string;
        trackingPixelUrl?: string | null;
        width?: number | null;
        height?: number | null;
        title?: string;
    }>;
}

export function ArticleRenderer({ article, slug, relatedArticleTitles, affiliateBannersByCategory }: ArticleRendererProps) {
    if (article.format === "mdx") {
        return <MDXContent source={article.content} />;
    }
    return <MDContent source={article.content} slug={slug} relatedArticleTitles={relatedArticleTitles} affiliateBannersByCategory={affiliateBannersByCategory} />;
}
