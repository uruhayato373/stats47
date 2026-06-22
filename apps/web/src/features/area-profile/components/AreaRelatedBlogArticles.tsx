import { readTagsForItemFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { Newspaper } from "lucide-react";

import { SurfaceLinkCard } from "@/components/surface";

import { listArticleSummariesByTagKey } from "@/features/blog/server";

import type { AreaProfileData } from "../types";

interface Props {
    profile: Pick<AreaProfileData, "strengths" | "weaknesses">;
    limit?: number;
}

export async function AreaRelatedBlogArticles({ profile, limit = 5 }: Props) {
    const topKeys = [
        ...profile.strengths.slice(0, 4),
        ...profile.weaknesses.slice(0, 2),
    ]
        .map((s) => s.rankingKey)
        .filter(Boolean);

    if (topKeys.length === 0) return null;

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

    if (allTagKeys.length === 0) return null;

    // タグから記事を並列取得、重複除去
    const articleResults = await Promise.all(
        allTagKeys.slice(0, 8).map((tagKey) => listArticleSummariesByTagKey(tagKey, 3))
    );

    const seenSlugs = new Set<string>();
    const articles: { slug: string; title: string }[] = [];
    for (const batch of articleResults) {
        for (const a of batch) {
            if (!seenSlugs.has(a.slug) && articles.length < limit) {
                seenSlugs.add(a.slug);
                articles.push({ slug: a.slug, title: a.title });
            }
        }
        if (articles.length >= limit) break;
    }

    if (articles.length === 0) return null;

    return (
        <section>
            <h2 className="text-2xl font-bold text-foreground mb-4 flex items-center gap-2">
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
