import React from "react";
import { AbsoluteFill } from "remotion";

import { IG_CARD, IG_SERIES } from "@/features/ig-series";
import { RankingTableSlide, type RankingEntry, type RankingMeta } from "@/shared";

interface QuizTableSlideProps {
  meta: RankingMeta;
  entries: RankingEntry[];
  precision: number;
}

const palette = IG_SERIES.quiz;
const MARGIN = 20;

/**
 * 4枚目: 全47都道府県テーブル（series 別ラッパー）。
 *
 * 共通コンポーネント `RankingTableSlide`（`@/shared`）は他コンポジション
 * （`RankingInstagram-Table` 等）にも使われる全面塗りの共有部品なので、内部は変更しない。
 * ここではシリーズの地色を縁取りとして敷き、47件の密なテーブル本体は
 * `theme="light"`（白背景）で読ませることで「白カード surfaces で密なデータを見せる」
 * 方針に沿わせる。
 */
export const QuizTableSlide: React.FC<QuizTableSlideProps> = ({ meta, entries, precision }) => (
  <AbsoluteFill style={{ backgroundColor: palette.bg, padding: MARGIN }}>
    <div
      style={{
        position: "relative",
        width: "100%",
        height: "100%",
        borderRadius: IG_CARD.radius,
        overflow: "hidden",
        border: `${IG_CARD.borderWidth}px solid ${IG_CARD.borderColor}`,
        boxShadow: IG_CARD.shadow,
      }}
    >
      <RankingTableSlide meta={meta} entries={entries} precision={precision} theme="light" displayTitle={meta.title} />
    </div>
  </AbsoluteFill>
);
