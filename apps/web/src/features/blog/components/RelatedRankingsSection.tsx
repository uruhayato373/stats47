import Link from "next/link";

import { metricDisplayName } from "@stats47/ranking";
import {
  getRankingTitle,
  readRankingItemByKeyAndAreaTypeFromR2,
  readRelatedRankingItemsByTagKeysFromR2,
} from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { BarChart3 } from "lucide-react";

import { RailCard, RailNavRow } from "@/components/surface";

import { getCategoryKeysForBlogTagKeys } from "@/config/category-blog-tag-keys";

interface RelatedRankingsSectionProps {
  tagKeys: string[];
  /** 記事が図や本文で使う指標 (blog snapshot の rankingRefs)。タグ・カテゴリ経由より先に出す */
  rankingKeys?: string[];
  compact?: boolean;
}

const MAX_RANKINGS = 6;

export async function RelatedRankingsSection({
  tagKeys,
  rankingKeys = [],
  compact = false,
}: RelatedRankingsSectionProps) {
  if (tagKeys.length === 0 && rankingKeys.length === 0) return null;

  // 記事が実際に使う指標を先に出す。タグ → カテゴリ経由は記事の主題と別の指標が混ざる
  // (metric の tags は空で、タグからはカテゴリの代表ランキングしか引けない)
  const [ownResults, result] = await Promise.all([
    Promise.all(
      rankingKeys.slice(0, MAX_RANKINGS).map((key) => readRankingItemByKeyAndAreaTypeFromR2(key, "prefecture")),
    ),
    tagKeys.length > 0
      ? readRelatedRankingItemsByTagKeysFromR2(tagKeys, getCategoryKeysForBlogTagKeys(tagKeys))
      : Promise.resolve(null),
  ]);
  const ownItems = ownResults.flatMap((r) => (isOk(r) ? r.data : []));
  const tagItems = result && isOk(result) ? result.data : [];

  const seen = new Set<string>();
  const rankings: { rankingKey: string; title: string }[] = [];

  for (const item of [...ownItems, ...tagItems]) {
    if (!seen.has(item.rankingKey) && rankings.length < MAX_RANKINGS) {
      seen.add(item.rankingKey);
      rankings.push({
        rankingKey: item.rankingKey,
        title: metricDisplayName({ title: getRankingTitle(item), readerLabel: item.readerLabel, subtitle: item.subtitle }),
      });
    }
  }

  if (rankings.length === 0) return null;

  return (
    <RailCard
      title="関連ランキング"
      icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
    >
      {compact ? (
        <nav aria-label="関連ランキング" className="-mx-4 flex flex-col">
          {rankings.map((ranking) => (
            <RailNavRow
              key={ranking.rankingKey}
              href={`/ranking/${ranking.rankingKey}`}
            >
              <span className="flex flex-col gap-0.5">
                <span className="line-clamp-2 leading-snug">
                  {ranking.title}
                </span>
                <span className="text-xs text-muted-foreground">
                  都道府県別ランキング
                </span>
              </span>
            </RailNavRow>
          ))}
        </nav>
      ) : (
        <div className="grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3">
          {rankings.map((ranking) => (
            <Link
              key={ranking.rankingKey}
              href={`/ranking/${ranking.rankingKey}`}
              className="group block border-b border-border py-3 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring"
            >
              <p className="line-clamp-2 text-sm font-medium group-hover:text-primary">
                {ranking.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                都道府県別ランキング
              </p>
            </Link>
          ))}
        </div>
      )}
    </RailCard>
  );
}
