import { readRankingItemsByTagFromR2, getRankingTitle } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { BarChart3 } from "lucide-react";

import { RailCard, SurfaceLinkCard } from "@/components/surface";

interface RelatedRankingsSectionProps {
  tagKeys: string[];
  compact?: boolean;
}

export async function RelatedRankingsSection({
  tagKeys,
  compact = false,
}: RelatedRankingsSectionProps) {
  if (tagKeys.length === 0) return null;

  const allResults = await Promise.all(
    tagKeys.map((tagKey) => readRankingItemsByTagFromR2(tagKey))
  );

  const seen = new Set<string>();
  const rankings: { rankingKey: string; title: string }[] = [];

  for (const result of allResults) {
    if (!isOk(result)) continue;
    for (const item of result.data.rankingItems) {
      if (!item) continue;
      if (item.areaType !== "prefecture") continue;
      if (!seen.has(item.rankingKey) && rankings.length < 6) {
        seen.add(item.rankingKey);
        rankings.push({
          rankingKey: item.rankingKey,
          title: item.readerLabel ?? getRankingTitle(item),
        });
      }
    }
    if (rankings.length >= 6) break;
  }

  if (rankings.length === 0) return null;

  return (
    <RailCard
      title="関連ランキング"
      icon={<BarChart3 className="h-4 w-4 text-muted-foreground" />}
      titleClassName="text-base font-semibold text-foreground"
      bodyClassName="p-4 pt-3"
    >
      <div className={compact ? "grid grid-cols-1 gap-2" : "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"}>
        {rankings.map((ranking) => (
          <SurfaceLinkCard
            key={ranking.rankingKey}
            href={`/ranking/${ranking.rankingKey}`}
            className="block p-3"
          >
            <p className="text-sm font-medium line-clamp-2">
              {ranking.title}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              都道府県別ランキング
            </p>
          </SurfaceLinkCard>
        ))}
      </div>
    </RailCard>
  );
}
