"use client";

import dynamic from "next/dynamic";

import { ContentDisclosure } from "@/components/content";

const DefinitionWithMath = dynamic(
  () => import("@/components/DefinitionWithMath").then((m) => m.DefinitionWithMath),
  { ssr: false },
);

interface RankingDefinitionCardProps {
  definition: string;
}

/**
 * ランキング統計の定義カード
 *
 * 統計の正式な定義を表示します。出典はページ末尾の DataSourceList が担う。
 * 定義文内の $...$（インライン）と $$...$$（ブロック）は KaTeX で描画します。
 */
export function RankingDefinitionCard({
  definition,
}: RankingDefinitionCardProps) {
  return (
    <ContentDisclosure title="統計の定義" headingLevel={3}>
      <DefinitionWithMath
        content={definition}
        className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
      />
    </ContentDisclosure>
  );
}
