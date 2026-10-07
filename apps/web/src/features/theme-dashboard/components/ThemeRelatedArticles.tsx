import "server-only";

import { normalizePercentInText } from "@stats47/data-configs/unit";
import { Newspaper } from "lucide-react";

import { SectionCard } from "@/components/surface";

import { getRelatedArticleSummaries, listArticlesUsingRankingKeys } from "@/features/blog/server";

import { TrackedThemeLink } from "./TrackedThemeLink";

interface ThemeRelatedArticlesProps {
  /** 関連記事を引くタグキー一覧 */
  tagKeys: string[];
  /** テーマの指標。同じ指標を図に使う記事をタグ経由より先に出す */
  rankingKeys?: string[];
  /** 表示する最大件数（デフォルト 6） */
  limit?: number;
}

/**
 * テーマダッシュボード用「関連記事」セクション。
 *
 * `tagKeys` の複数タグの記事を集約（取得+重複除去は共有 getRelatedArticleSummaries）し、
 * 3 列グリッドで最大 `limit` 件表示する。データ集約は共有ロジック、presentation のみ本コンポーネント。
 */
export async function ThemeRelatedArticles({
  tagKeys,
  rankingKeys = [],
  limit = 6,
}: ThemeRelatedArticlesProps) {
  // テーマの指標を多く使う記事を先に (タグの付け方に依らず同じデータを扱う記事)、残りをタグで埋める
  const [byMetric, byTag] = await Promise.all([
    listArticlesUsingRankingKeys(rankingKeys, { limit }),
    tagKeys.length > 0 ? getRelatedArticleSummaries(tagKeys, { limit }) : Promise.resolve([]),
  ]);
  const seen = new Set<string>();
  const visible = [...byMetric, ...byTag]
    .filter((article) => !seen.has(article.slug) && seen.add(article.slug))
    .slice(0, limit);

  if (visible.length === 0) return null;

  return (
    <SectionCard
      className="mt-8"
      title="関連記事"
      icon={<Newspaper className="h-4 w-4 text-muted-foreground" />}
    >
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {visible.map((article) => (
          <TrackedThemeLink
            key={article.slug}
            href={`/blog/${article.slug}`}
            trackingLabel={`theme-related-articles:${article.slug}`}
            surface="theme_blog"
            className="block rounded-none p-3 transition-colors hover:bg-accent/40"
          >
            <p className="text-sm font-medium line-clamp-2 leading-snug">
              {article.title}
            </p>
            {article.description && (
              <p className="mt-1.5 text-xs text-muted-foreground line-clamp-2">
                {normalizePercentInText(article.description)}
              </p>
            )}
          </TrackedThemeLink>
        ))}
      </div>
    </SectionCard>
  );
}
