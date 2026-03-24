import Link from "next/link";
import { ArrowRightLeft, ChevronRight } from "lucide-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@stats47/components/atoms/ui/card";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { findRankingItemsByGroupKey } from "@stats47/ranking/server";

interface RelatedGroupCardProps {
  rankingKey: string;
  areaType: AreaType;
  groupKey: string;
}

export async function RelatedGroupCard({
  rankingKey,
  areaType,
  groupKey,
}: RelatedGroupCardProps) {
  const result = await findRankingItemsByGroupKey(groupKey, areaType);
  if (!isOk(result) || result.data.length <= 1) return null;

  return (
    <Card>
      <CardHeader className="py-3 px-4">
        <ArrowRightLeft className="h-4 w-4 text-muted-foreground" />
        <CardTitle className="text-sm font-medium text-muted-foreground">
          同じ指標の別の見方
        </CardTitle>
      </CardHeader>
      <CardContent className="px-4 pb-4 pt-0">
        <nav className="flex flex-col gap-1">
          {result.data.map((item) => {
            const label = item.normalizationBasis
              ? `${item.title}（${item.normalizationBasis}）`
              : `${item.title}（${item.unit}）`;
            const isCurrent = item.rankingKey === rankingKey;

            if (isCurrent) {
              return (
                <div
                  key={item.rankingKey}
                  className="flex items-start gap-2 px-2 py-1.5 rounded-md bg-accent/50"
                >
                  <ChevronRight className="w-3.5 h-3.5 text-primary shrink-0 mt-0.5" />
                  <span className="text-sm line-clamp-2 leading-snug font-medium">
                    {label}
                  </span>
                </div>
              );
            }

            return (
              <Link
                key={item.rankingKey}
                href={`/ranking/${item.rankingKey}`}
                className="group flex items-start gap-2 px-2 py-1.5 rounded-md hover:bg-accent/50 transition-colors"
              >
                <ChevronRight className="w-3.5 h-3.5 text-muted-foreground/60 shrink-0 mt-0.5 group-hover:text-primary transition-colors" />
                <span className="text-sm line-clamp-2 leading-snug">
                  {label}
                </span>
              </Link>
            );
          })}
        </nav>
      </CardContent>
    </Card>
  );
}
