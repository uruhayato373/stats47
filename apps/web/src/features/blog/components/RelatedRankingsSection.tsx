import Link from "next/link";

import { getRankingTitle, readRelatedRankingItemsByTagKeysFromR2 } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { BarChart3 } from "lucide-react";

import { RailCard } from "@/components/surface";

import { getCategoryKeysForBlogTagKeys } from "@/config/category-blog-tag-keys";

interface RelatedRankingsSectionProps {
  tagKeys: string[];
  compact?: boolean;
}

export async function RelatedRankingsSection({
  tagKeys,
  compact = false,
}: RelatedRankingsSectionProps) {
  if (tagKeys.length === 0) return null;

  const result = await readRelatedRankingItemsByTagKeysFromR2(
    tagKeys,
    getCategoryKeysForBlogTagKeys(tagKeys),
  );
  if (!isOk(result)) return null;

  const seen = new Set<string>();
  const rankings: { rankingKey: string; title: string }[] = [];

  for (const item of result.data) {
    if (!seen.has(item.rankingKey) && rankings.length < 6) {
      seen.add(item.rankingKey);
      rankings.push({
        rankingKey: item.rankingKey,
        title: item.readerLabel ?? getRankingTitle(item),
      });
    }
  }

  if (rankings.length === 0) return null;

  return (
    <RailCard
      title="関連ランキング"
      icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      titleClassName="text-base font-semibold text-foreground"
      bodyClassName="p-4 pt-3"
    >
      <div className={compact ? "divide-y divide-border" : "grid grid-cols-1 gap-x-4 sm:grid-cols-2 lg:grid-cols-3"}>
        {rankings.map((ranking) => (
          <Link
            key={ranking.rankingKey}
            href={`/ranking/${ranking.rankingKey}`}
            className="group block border-b border-border py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
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
    </RailCard>
  );
}
