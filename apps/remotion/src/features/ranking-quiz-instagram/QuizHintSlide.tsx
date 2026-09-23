import React from "react";

import { TILE_GRID_LAYOUT } from "@stats47/visualization";

import { FONT } from "@/shared";

import { QUIZ_COLORS, QuizFrame } from "./QuizFrame";
import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "./quiz";

const CELL = 48;
const GAP = 5;
/** 地図下端とブランド行の間隔（ブランド行は下端から約 76px を占める） */
const FOOTER_CLEARANCE = 90;
const minX = Math.min(...TILE_GRID_LAYOUT.map((c) => c.x));
const maxX = Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const maxY = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));

interface QuizHintSlideProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 2枚目: ヒント。正解を含む候補を「?」で伏せ、指定した県だけ順位を明かす */
export const QuizHintSlide: React.FC<QuizHintSlideProps> = ({ spec, quiz }) => (
  <QuizFrame pill="ヒント" pillVariant="outline" swipeLabel="答えは次へ" sourceLabel={spec.sourceLabel}>
    <h1 style={{ fontSize: 68, fontWeight: FONT.weight.black, lineHeight: 1.3, marginTop: 36 }}>
      {spec.hint.headline}
      <br />
      <span style={{ color: QUIZ_COLORS.highlight }}>{spec.hint.accent}</span>
    </h1>
    <p
      style={{
        fontSize: 30,
        color: QUIZ_COLORS.muted,
        marginTop: 14,
        lineHeight: 1.6,
        whiteSpace: "pre-line",
      }}
    >
      {spec.hint.body}
    </p>
    {/* 本文の行数に関係なくフッターへ食い込まないよう、残りの高さに収まるよう縮小する */}
    <div style={{ flex: 1, minHeight: 0, marginTop: 24, marginBottom: FOOTER_CLEARANCE }}>
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
          const fill = masked
            ? QUIZ_COLORS.highlight
            : rank !== undefined
              ? QUIZ_COLORS.accent
              : QUIZ_COLORS.card;
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
                fontFamily={FONT.family}
                fontSize={masked ? 36 : rank !== undefined ? 20 : 15}
                fontWeight={emphasized ? FONT.weight.black : FONT.weight.medium}
                fill={emphasized ? QUIZ_COLORS.background : QUIZ_COLORS.tileLabel}
              >
                {label}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  </QuizFrame>
);
