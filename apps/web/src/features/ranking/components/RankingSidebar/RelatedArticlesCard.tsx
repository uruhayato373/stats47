import { readTagsForItemFromR2 } from "@stats47/ranking/server";
import { isOk, type AreaType } from "@stats47/types";
import { Newspaper } from "lucide-react";

import { RailCard, RailLinkList, RailNavRow, railNavRowClassName } from "@/components/surface";

import {
  getRelatedArticleSummaries,
  listArticlesUsingRankingKeys,
  listMetricPairArticles,
} from "@/features/blog/server";
import { findKindleProductForBlog, TrackedProductLink } from "@/features/products";

interface RelatedArticlesCardProps {
  rankingKey: string;
  areaType: AreaType;
}

export async function RelatedArticlesCard({
  rankingKey,
  areaType,
}: RelatedArticlesCardProps) {
  // この指標を図に使う記事と、散布図でこの指標を扱う記事 (相関記事) は都道府県データなので prefecture だけ引く
  const [tagsResult, metricArticles, pairArticles] = await Promise.all([
    readTagsForItemFromR2(rankingKey, areaType),
    areaType === "prefecture" ? listArticlesUsingRankingKeys([rankingKey], { limit: 3 }) : Promise.resolve([]),
    areaType === "prefecture" ? listMetricPairArticles(rankingKey) : Promise.resolve([]),
  ]);
  const tagKeys = isOk(tagsResult) ? tagsResult.data : [];

  // タグ群 → 関連記事を集約（取得+重複除去は共有ロジック、上限3件）
  const tagArticles = await getRelatedArticleSummaries(tagKeys, {
    limit: 3,
    perTag: 3,
  });

  // この指標そのものを扱う記事をタグ一致より先に出す。metric の tags は空なのでタグ経由ではほぼ出ない
  // (2026-10-07 実測: tags を持つ metric config 0 件)。図に使う記事 → 相関記事 → タグの順
  const seen = new Set<string>();
  const relatedArticles = [...metricArticles, ...pairArticles, ...tagArticles]
    .filter((article) => !seen.has(article.slug) && seen.add(article.slug))
    .slice(0, 3);

  if (relatedArticles.length === 0) return null;

  // 表示中の関連記事を実際に収録した Kindle 本だけを出す (タグやカテゴリからの推測はしない)
  const kindleProduct = relatedArticles
    .map((article) => findKindleProductForBlog(article.slug))
    .find((product) => product !== null) ?? null;

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
      {kindleProduct && (
        <div className="mt-2 border-t border-border pt-2">
          <p className="px-2 text-xs text-muted-foreground">この記事を収録した本</p>
          <TrackedProductLink
            href={`/products/${kindleProduct.slug}`}
            label={`${kindleProduct.id}:${kindleProduct.title}`}
            surface="ranking_product"
            className={railNavRowClassName({})}
          >
            <span className="line-clamp-2 min-w-0 flex-1 leading-snug">
              {kindleProduct.title}（Kindle）
            </span>
          </TrackedProductLink>
        </div>
      )}
    </RailCard>
  );
}
