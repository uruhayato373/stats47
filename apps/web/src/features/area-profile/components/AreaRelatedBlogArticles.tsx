import { readTagsForItemFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { Newspaper } from "lucide-react";

import { SurfaceLinkCard } from "@/components/surface";

import { getRelatedArticleSummaries, listArticlesUsingRankingKeys } from "@/features/blog/server";

import type { AreaHighlights } from "@stats47/area-profile";

interface Props {
    /** 県の「特徴」と同じ選定結果 (selectAreaHighlights)。ここで切り出さない */
    highlights: AreaHighlights;
    limit?: number;
}

export async function AreaRelatedBlogArticles({ highlights, limit = 5 }: Props) {
    const topKeys = [...highlights.top, ...highlights.bottom].map((s) => s.rankingKey);

    if (topKeys.length === 0) return null;

    // この県の特徴になっている指標を図に使う記事を先に出す。ranking item の tags は空なので
    // タグ経由ではほぼ出ない (2026-10-07 実測: R2 の ranking item 2,467 件中 0 件)
    const metricArticles = await listArticlesUsingRankingKeys(topKeys, { limit });

    // 上位 ranking keys のタグを並列取得
    const tagResults = await Promise.all(
        topKeys.map((key) => readTagsForItemFromR2(key, "prefecture"))
    );

    const allTagKeys: string[] = [];
    const seenTags = new Set<string>();
    for (const result of tagResults) {
        if (!isOk(result)) continue;
        for (const tag of result.data) {
            if (!seenTags.has(tag)) {
                seenTags.add(tag);
                allTagKeys.push(tag);
            }
        }
    }

    // タグから記事を集約（取得+重複除去は共有ロジック）
    const tagArticles =
        allTagKeys.length > 0
            ? await getRelatedArticleSummaries(allTagKeys.slice(0, 8), { limit, perTag: 3 })
            : [];

    const seen = new Set<string>();
    const articles = [...metricArticles, ...tagArticles]
        .filter((article) => !seen.has(article.slug) && seen.add(article.slug))
        .slice(0, limit);

    if (articles.length === 0) return null;

    return (
        <section>
            <h2 className="text-xl font-bold text-foreground mb-4 flex items-center gap-2">
                <Newspaper className="h-5 w-5 text-muted-foreground" />
                関連統計記事
            </h2>
            <nav className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {articles.map((article) => (
                    <SurfaceLinkCard
                        key={article.slug}
                        href={`/blog/${article.slug}`}
                        className="group flex items-start gap-2 p-3"
                    >
                        <span className="mt-0.5 text-muted-foreground shrink-0 group-hover:text-primary transition-colors">›</span>
                        <span className="text-sm line-clamp-2 leading-snug">
                            {article.title}
                        </span>
                    </SurfaceLinkCard>
                ))}
            </nav>
        </section>
    );
}
