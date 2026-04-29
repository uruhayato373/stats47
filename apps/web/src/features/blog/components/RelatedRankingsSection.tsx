import Link from "next/link";

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { readRankingItemsByTagFromR2, getRankingTitle } from "@stats47/ranking/server";
import { isOk } from "@stats47/types";
import { BarChart3 } from "lucide-react";

interface RelatedRankingsSectionProps {
  tagKeys: string[];
}

export async function RelatedRankingsSection({
  tagKeys,
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
          title: getRankingTitle(item),
        });
      }
    }
    if (rankings.length >= 6) break;
  }

  if (rankings.length === 0) return null;

  return (
    <Card>
      <CardHeader className="py-4 px-4">
        <BarChart3 className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-base">関連ランキング</CardTitle>
      </CardHeader>
      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {rankings.map((ranking) => (
            <Link
              key={ranking.rankingKey}
              href={`/ranking/${ranking.rankingKey}`}
              className="block rounded-md border border-border p-3 transition-colors hover:border-primary hover:bg-accent/50"
            >
              <p className="text-sm font-medium line-clamp-2">
                {ranking.title}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                都道府県別ランキング
              </p>
            </Link>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
