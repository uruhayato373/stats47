import React from "react";

import { TILE_GRID_LAYOUT } from "@stats47/visualization";

import { IG_FONT, IG_HEADLINE_STYLE, IG_SERIES, IgSeriesCard, IgSeriesFrame } from "@/features/ig-series";

import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "./quiz";

const CELL = 46;
const GAP = 5;
/** 地図下端とブランド行の間隔（ブランド行は下端から約 76px を占める） */
const FOOTER_CLEARANCE = 90;
const minX = Math.min(...TILE_GRID_LAYOUT.map((c) => c.x));
const maxX = Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const maxY = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));

const palette = IG_SERIES.quiz;
/** タイル地図はカード内（白地）に置くので、塗りはカード基準の色（#111 系）で作る */
const TILE_MASKED_FILL = palette.accent; // 「?」= 伏せた候補（濃い金）
const TILE_REVEALED_FILL = palette.bg; // 順位を明かした県（黄）
const TILE_DEFAULT_FILL = "#F1F5F9"; // それ以外の県（淡いグレー）
const TILE_DEFAULT_LABEL = "#475569"; // 淡いグレー地に対し contrast 6.92:1

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
        viewBox={`0 0 ${(maxX - minX) * CELL} ${maxY * CELL}`}
        style={{ width: "100%", height: "100%" }}
      >
        {TILE_GRID_LAYOUT.map((cell) => {
          const code = toPrefCode(cell.id);
          const w = (cell.w ?? 1) * CELL - GAP;
          const h = (cell.h ?? 1) * CELL - GAP;
          const x = (cell.x - minX) * CELL;
          const y = cell.y * CELL;
          const masked = quiz.maskedPrefCodes.has(code);
          const rank = quiz.revealedRanks.get(code);
          const fill = masked ? TILE_MASKED_FILL : rank !== undefined ? TILE_REVEALED_FILL : TILE_DEFAULT_FILL;
          const label = masked ? "?" : rank !== undefined ? `${rank}位` : cell.name;
          const emphasized = masked || rank !== undefined;
          return (
            <g key={cell.id}>
              <rect x={x} y={y} width={w} height={h} rx={8} fill={fill} />
              <text
                x={x + w / 2}
                y={y + h / 2}
                textAnchor="middle"
                dominantBaseline="central"
                fontFamily={IG_FONT.body}
                fontSize={masked ? 34 : rank !== undefined ? 19 : 14}
                fontWeight={emphasized ? IG_FONT.weight.black : 500}
                fill={masked ? "#FFFFFF" : rank !== undefined ? "#111111" : TILE_DEFAULT_LABEL}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </IgSeriesCard>
  </IgSeriesFrame>
);
