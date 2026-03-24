import { type Article } from "../types/article.types";
import { MDContent } from "./md-content";
import { MDXContent } from "./mdx-content";

interface ArticleRendererProps {
    article: Article;
    slug: string;
    relatedArticleTitles?: Record<string, string>;
}

export function ArticleRenderer({ article, slug, relatedArticleTitles }: ArticleRendererProps) {
    if (article.format === "mdx") {
        return <MDXContent source={article.content} />;
    }
    return <MDContent source={article.content} slug={slug} relatedArticleTitles={relatedArticleTitles} />;
}
