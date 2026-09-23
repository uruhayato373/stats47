import { readTagsForItemFromR2 } from "@stats47/ranking/server";
import { isOk, type AreaType } from "@stats47/types";
import { Newspaper } from "lucide-react";

import { RailCard, RailLinkList, RailNavRow } from "@/components/surface";

import { getRelatedArticleSummaries, listMetricPairArticles } from "@/features/blog/server";

interface RelatedArticlesCardProps {
  rankingKey: string;
  areaType: AreaType;
}

export async function RelatedArticlesCard({
  rankingKey,
  areaType,
}: RelatedArticlesCardProps) {
  // 散布図でこの指標を扱う記事 (相関記事) は都道府県データなので prefecture だけ引く
  const [tagsResult, pairArticles] = await Promise.all([
    readTagsForItemFromR2(rankingKey, areaType),
    areaType === "prefecture" ? listMetricPairArticles(rankingKey) : Promise.resolve([]),
  ]);
  const tagKeys = isOk(tagsResult) ? tagsResult.data : [];

  // タグ群 → 関連記事を集約（取得+重複除去は共有ロジック、上限3件）
  const tagArticles = await getRelatedArticleSummaries(tagKeys, {
    limit: 3,
    perTag: 3,
  });

  // この指標そのものを扱う記事をタグ一致より先に出す。相関記事は tags が空でタグ経由では出ない
  const seen = new Set<string>();
  const relatedArticles = [...pairArticles, ...tagArticles]
    .filter((article) => !seen.has(article.slug) && seen.add(article.slug))
    .slice(0, 3);

  if (relatedArticles.length === 0) return null;

  return (
    <RailCard
      title="関連記事"
      icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
    >
      <RailLinkList>
        {relatedArticles.map((article) => (
          <RailNavRow key={article.slug} href={`/blog/${article.slug}`} chevron={false}>
            <span className="line-clamp-2 leading-snug">
              {article.title}
            </span>
          </RailNavRow>
        ))}
      </RailLinkList>
    </RailCard>
  );
}
