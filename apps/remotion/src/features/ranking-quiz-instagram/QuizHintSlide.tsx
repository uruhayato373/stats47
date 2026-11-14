import React from "react";

import { prefectureShortName } from "@stats47/area/short-name";

import { IMAGE_TILE_LAYOUT } from "@/features/data-cards/tile-layout";
import { prefectureEntries, renderTileMapBody } from "@/features/data-cards/all47-svg";

import { IG_FONT, IG_HEADLINE_STYLE, IG_SERIES, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "./quiz";

/** 地図下端と出典行 (IgSeriesFooter) の間隔（出典行は下端から約 76px を占める） */
const FOOTER_CLEARANCE = 90;

const palette = IG_SERIES.quiz;
/** タイル地図はカード内（白地）に置くので、塗りはカード基準の色（#111 系）で作る */
const TILE_MASKED_FILL = palette.accent; // 「?」= 伏せた候補（濃い金）
const TILE_REVEALED_FILL = palette.bg; // 順位を明かした県（黄）
const TILE_DEFAULT_FILL = "#F1F5F9"; // それ以外の県（淡いグレー）
/** The shared tile map (all47-svg.ts): candidates as "?", revealed ranks, everything else name only. */
export const HINT_MAP = { width: IMAGE_TILE_LAYOUT.cols * 46, height: IMAGE_TILE_LAYOUT.rows * 46 };
export function hintTiles(quiz: ResolvedRankingQuiz) {
  const entries = prefectureEntries();
  const names = new Map(entries.map((e) => [e.areaCode.slice(0, 2), prefectureShortName(e.areaName)]));
  return renderTileMapBody(entries, {
    ...HINT_MAP,
    tileOverride: (areaCode) => {
      const code = toPrefCode(areaCode.slice(0, 2));
      if (quiz.maskedPrefCodes.has(code)) return { fill: TILE_MASKED_FILL, lines: ["?"], emphasis: true };
      const rank = quiz.revealedRanks.get(code);
      if (rank !== undefined) return { fill: TILE_REVEALED_FILL, lines: [names.get(code)!, `${rank}位`] };
      return { fill: TILE_DEFAULT_FILL, lines: [names.get(code)!] };
    },
  }).svg;
}

interface QuizHintSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 2枚目: ヒント。正解を含む候補を「?」で伏せ、指定した県だけ順位を明かす */
export const QuizHintSlide: React.FC<QuizHintSlideProps> = ({ spec, quiz }) => (
  <IgSeriesFrame series="quiz" tag="ヒント" tagVariant="outline" swipeLabel="答えは次へ" sourceLabel={spec.sourceLabel}>
    <h1
      style={{
        ...IG_HEADLINE_STYLE,
        fontSize: 62,
        lineHeight: 1.4,
        marginTop: 32,
      }}
    >
      {spec.hint.headline}
      <br />
      {spec.hint.accent}
    </h1>
    <p
      style={{
        fontSize: 28,
        fontWeight: IG_FONT.weight.bold,
        marginTop: 12,
        lineHeight: 1.6,
        whiteSpace: "pre-line",
        color: palette.inkSmall,
      }}
    >
      {spec.hint.body}
    </p>
    {/* 本文の行数に関係なくフッターへ食い込まないよう、残りの高さに収まるよう縮小する。
        タイル地図は密なデータなので白カードに載せて黄地でも読めるようにする */}
    <IgSeriesCard
      style={{ flex: 1, minHeight: 0, marginTop: 22, marginBottom: FOOTER_CLEARANCE, padding: 16 }}
    >
      <svg
        viewBox={`0 0 ${HINT_MAP.width} ${HINT_MAP.height}`}
        style={{ width: "100%", height: "100%" }}
        dangerouslySetInnerHTML={{ __html: hintTiles(quiz) }}
      />
    </IgSeriesCard>
  </IgSeriesFrame>
);
