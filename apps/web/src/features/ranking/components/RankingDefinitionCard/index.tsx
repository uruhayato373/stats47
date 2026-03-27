"use client";

import dynamic from "next/dynamic";
import { ExternalLink } from "lucide-react";

import type { RankingItem } from "@stats47/ranking";

const DefinitionWithMath = dynamic(
  () => import("@/components/DefinitionWithMath").then((m) => m.DefinitionWithMath),
  { ssr: false },
);

interface RankingDefinitionCardProps {
  definition: string;
  itemDetail: RankingItem;
}

/**
 * ランキング統計の定義カード
 *
 * 統計の正式な定義と出典元を表示します。
 * 定義文内の $...$（インライン）と $$...$$（ブロック）は KaTeX で描画します。
 */
export function RankingDefinitionCard({
  definition,
  itemDetail,
}: RankingDefinitionCardProps) {
  return (
    <div className="rounded-lg border bg-card p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-3">統計の定義</h3>

      <DefinitionWithMath
        content={definition}
        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
      />

      {/* 出典元 */}
      {itemDetail?.source && (
        <div className="flex items-center gap-1 text-xs text-muted-foreground mt-4 pt-4 border-t">
          <span>出典:</span>
          <a
            href={itemDetail.source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-0.5 hover:underline text-muted-foreground hover:text-foreground transition-colors"
          >
            {itemDetail.source.name}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      )}
    </div>
  );
}
