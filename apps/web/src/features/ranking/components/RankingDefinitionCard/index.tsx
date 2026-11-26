"use client";

import dynamic from "next/dynamic";

import { ContentDisclosure } from "@/components/content";

const DefinitionWithMath = dynamic(
  () => import("@/components/DefinitionWithMath").then((m) => m.DefinitionWithMath),
  { ssr: false },
);

interface RankingDefinitionCardProps {
  /** 集計条件 (「2025年・全目的・一般客」など) */
  condition?: string | null;
  /** 統計の正式な定義 */
  definition?: string | null;
  /** 読み違いを防ぐ注意 (対象外・重複計上など) */
  note?: string | null;
}

/**
 * ランキング統計の定義カード (開閉式)
 *
 * 集計条件・正式な定義・読み違いを防ぐ注意をまとめて置く。2026-11-26 まで集計条件は地図の下、注意は本文の先頭に
 * 常に出していたが、多くの読者には要らない説明が画面を埋めていたので、ここに畳んだ (オーナー決定)。
 * 出典はページ末尾の DataSourceList が担う。定義文内の $...$（インライン）と $$...$$（ブロック）は KaTeX で描画します。
 */
export function RankingDefinitionCard({
  condition,
  definition,
  note,
}: RankingDefinitionCardProps) {
  if (!condition && !definition && !note) return null;
  return (
    <ContentDisclosure title="統計の定義" headingLevel={3}>
      <div className="space-y-2 text-sm leading-relaxed text-muted-foreground">
        {condition && <p>集計条件: {condition}</p>}
        {definition && (
          <DefinitionWithMath
            content={definition}
            className="text-sm text-muted-foreground whitespace-pre-wrap leading-relaxed"
          />
        )}
        {note && <p>{note}</p>}
      </div>
    </ContentDisclosure>
  );
}
