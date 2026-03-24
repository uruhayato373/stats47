import Link from "next/link";
import { Newspaper, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { getTagsForItem } from "@stats47/ranking/server";
import { listArticleSummariesByTagKey } from "@/features/blog/server";

interface RelatedArticlesCardProps {
  rankingKey: string;
  areaType: AreaType;
}

export async function RelatedArticlesCard({
  rankingKey,
  areaType,
}: RelatedArticlesCardProps) {
  const tagsResult = await getTagsForItem(rankingKey, areaType);
  if (!isOk(tagsResult) || tagsResult.data.length === 0) return null;

  const tagKeys = tagsResult.data.map((t) => t.tagKey);

  // 全タグの記事を並列取得し、重複を除去して最大3件
  const allResults = await Promise.all(
    tagKeys.map((tagKey) => listArticleSummariesByTagKey(tagKey, 3))
  );

  const seen = new Set<string>();
  const relatedArticles: { slug: string; title: string; description: string | null }[] = [];
  for (const articles of allResults) {
    for (const a of articles) {
      if (!seen.has(a.slug) && relatedArticles.length < 3) {
        seen.add(a.slug);
        relatedArticles.push({ slug: a.slug, title: a.title, description: a.description });
      }
    }
    if (relatedArticles.length >= 3) break;
  }

  if (relatedArticles.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <Newspaper className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          関連記事
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <nav className="flex flex-col gap-1">
          {relatedArticles.map((article) => (
            <Link
              key={article.slug}
              href={`/blog/${article.slug}`}
              className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
            >
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
              <span className="text-sm line-clamp-2 leading-snug">
                {article.title}
              </span>
            </Link>
          ))}
        </nav>
      </CardContent>
    </Card>
  );
}
