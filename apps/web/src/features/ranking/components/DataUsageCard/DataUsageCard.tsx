"use client";

import { Download } from "lucide-react";

import { Button } from "@stats47/components/atoms/ui/button";

import type { AreaType } from "@/features/area";
import { trackCsvDownload } from "@/lib/analytics/events";

interface DataUsageCardProps {
  rankingKey: string;
  areaType: AreaType;
  displayInfo: {
    title: string;
    subtitle: string;
    demographicAttr: string | null;
    normalizationBasis: string | null;
  };
  yearCount?: number;
  normalizationType?: string;
  hasAllBases?: boolean;
}

export function DataUsageCard({
  rankingKey,
  yearCount,
  normalizationType,
  hasAllBases,
}: DataUsageCardProps) {
  const yearText = yearCount && yearCount > 0 ? `${yearCount}年分の時系列を含む` : "";

  // 全基準があればまとめてDL、なければ現在の基準でDL
  const basis = hasAllBases ? "all-bases" : (normalizationType ?? "original");
  const href = `/api/ranking/${encodeURIComponent(rankingKey)}/download?format=csv&basis=${basis}`;

  return (
    <div className="flex items-center gap-4 rounded-none border border-primary/20 bg-primary/5 p-4 shadow-sm">
      <div className="min-w-0 flex-1">
        <h2 className="text-sm font-bold text-primary">このデータを使う</h2>
        <p className="mt-0.5 text-xs text-muted-foreground">
          47都道府県{yearText ? ` × ${yearText}` : "の"}データをCSVでダウンロード。クレジット表記すれば無料で商用利用できます。
        </p>
      </div>
      <Button
        variant="default"
        size="sm"
        className="gap-1.5 shrink-0"
        asChild
      >
        <a
          href={href}
          onClick={() => trackCsvDownload({ rankingKey, yearCode: "all" })}
        >
          <Download className="h-4 w-4" />
          ダウンロード
        </a>
      </Button>
    </div>
  );
}
