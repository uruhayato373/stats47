import { readTagsForItemFromR2 } from "@stats47/ranking/server";
import { isOk, type AreaType } from "@stats47/types";
import { Newspaper } from "lucide-react";

import { RailCard, RailLinkItem, RailLinkList } from "@/components/surface";

import { getRelatedArticleSummaries } from "@/features/blog/server";

interface RelatedArticlesCardProps {
  rankingKey: string;
  areaType: AreaType;
}

export async function RelatedArticlesCard({
  rankingKey,
  areaType,
}: RelatedArticlesCardProps) {
  const tagsResult = await readTagsForItemFromR2(rankingKey, areaType);
  if (!isOk(tagsResult) || tagsResult.data.length === 0) return null;

  // タグ群 → 関連記事を集約（取得+重複除去は共有ロジック、上限3件）
  const relatedArticles = await getRelatedArticleSummaries(tagsResult.data, {
    limit: 3,
    perTag: 3,
  });

  if (relatedArticles.length === 0) return null;

  return (
    <RailCard
      title="関連記事"
      icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
    >
      <RailLinkList>
        {relatedArticles.map((article) => (
          <RailLinkItem key={article.slug} href={`/blog/${article.slug}`}>
            <span className="line-clamp-2 leading-snug">
              {article.title}
            </span>
          </RailLinkItem>
        ))}
      </RailLinkList>
    </RailCard>
  );
}
