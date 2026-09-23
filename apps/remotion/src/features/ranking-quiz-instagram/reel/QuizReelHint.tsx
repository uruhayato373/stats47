import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { TILE_GRID_LAYOUT } from "@stats47/visualization";

import {
  IG_FONT,
  IG_HEADLINE_STYLE,
  IG_NUMBER_STYLE,
  IG_SERIES,
  IgSeriesCard,
  IgSeriesReelFrame,
} from "@/features/ig-series";

import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "../quiz";
import { QUIZ_REEL_SCENE_DURATION } from "./timeline";

const CELL = 44;
const GAP = 5;
const minX = Math.min(...TILE_GRID_LAYOUT.map((c) => c.x));
const maxX = Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const maxY = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));

const palette = IG_SERIES.quiz;
const TILE_MASKED_FILL = palette.accent;
const TILE_REVEALED_FILL = palette.bg;
const TILE_DEFAULT_FILL = "#F1F5F9";
const TILE_DEFAULT_LABEL = "#475569";

/** カウントダウンはシーン末尾の3ステップ（3→2→1）。尺は timeline.ts の SSOT から逆算する */
const COUNTDOWN_LABELS = ["3", "2", "1"];
const COUNTDOWN_STEP = 20;
const COUNTDOWN_START = QUIZ_REEL_SCENE_DURATION.hint - COUNTDOWN_STEP * COUNTDOWN_LABELS.length;

interface QuizReelHintProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 7-10秒: 候補を「?」で伏せたタイル地図（白カード） + 答え合わせへの3-2-1カウントダウン */
export const QuizReelHint: React.FC<QuizReelHintProps> = ({ spec, quiz }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bodySpring = spring({ frame, fps, config: { damping: 14 } });

  const countdownFrame = frame - COUNTDOWN_START;
  const countdownIndex = Math.floor(countdownFrame / COUNTDOWN_STEP);
  const showCountdown = countdownFrame >= 0 && countdownIndex < COUNTDOWN_LABELS.length;
  const countdownLocalFrame = countdownFrame - countdownIndex * COUNTDOWN_STEP;
  const countdownSpring = showCountdown
    ? spring({ frame: countdownLocalFrame, fps, config: { damping: 8, mass: 0.5 } })
    : 0;

  return (
    <IgSeriesReelFrame series="quiz" tag="ヒント" tagVariant="outline" sourceLabel={spec.sourceLabel}>
      <h1
        style={{
          ...IG_HEADLINE_STYLE,
          fontSize: 52,
          lineHeight: 1.4,
          opacity: bodySpring,
          transform: `translateY(${interpolate(bodySpring, [0, 1], [24, 0])}px)`,
        }}
      >
        {spec.hint.headline}
        <br />
        {spec.hint.accent}
      </h1>
      <p
        style={{
          fontSize: 26,
          fontWeight: IG_FONT.weight.bold,
          marginTop: 10,
          lineHeight: 1.6,
          whiteSpace: "pre-line",
          color: palette.inkSmall,
        }}
      >
        {spec.hint.body}
      </p>
      <IgSeriesCard style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 18, padding: 16 }}>
        <svg viewBox={`0 0 ${(maxX - minX) * CELL} ${maxY * CELL}`} style={{ width: "100%", height: "100%" }}>
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
                  fontSize={masked ? 32 : rank !== undefined ? 18 : 13}
                  fontWeight={emphasized ? IG_FONT.weight.black : 500}
                  fill={masked ? "#FFFFFF" : rank !== undefined ? "#111111" : TILE_DEFAULT_LABEL}
                >
                  {label}
                </text>
              </g>
            );
          })}
        </svg>
        {showCountdown && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span
              style={{
                ...IG_NUMBER_STYLE,
                fontSize: 240,
                color: palette.accent,
                textShadow: "0 0 40px rgba(255,255,255,0.9)",
                opacity: interpolate(countdownSpring, [0, 1], [0, 1]),
                transform: `scale(${interpolate(countdownSpring, [0, 1], [1.6, 1])})`,
              }}
            >
              {COUNTDOWN_LABELS[countdownIndex]}
            </span>
          </div>
        )}
      </IgSeriesCard>
    </IgSeriesReelFrame>
  );
};
