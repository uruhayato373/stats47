import React from "react";
import { interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";

import { TILE_GRID_LAYOUT } from "@stats47/visualization";

import { FONT } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";
import { toPrefCode, type RankingQuizSpec, type ResolvedRankingQuiz } from "../quiz";
import { QuizReelFrame } from "./QuizReelFrame";
import { QUIZ_REEL_SCENE_DURATION } from "./timeline";

const CELL = 46;
const GAP = 5;
const minX = Math.min(...TILE_GRID_LAYOUT.map((c) => c.x));
const maxX = Math.max(...TILE_GRID_LAYOUT.map((c) => c.x + (c.w ?? 1)));
const maxY = Math.max(...TILE_GRID_LAYOUT.map((c) => c.y + (c.h ?? 1)));

/** カウントダウンはシーン末尾の3ステップ（3→2→1）。尺は timeline.ts の SSOT から逆算する */
const COUNTDOWN_LABELS = ["3", "2", "1"];
const COUNTDOWN_STEP = 20;
const COUNTDOWN_START = QUIZ_REEL_SCENE_DURATION.hint - COUNTDOWN_STEP * COUNTDOWN_LABELS.length;

interface QuizReelHintProps {
  spec: RankingQuizSpec;
  quiz: ResolvedRankingQuiz;
}

/** 7-10秒: 候補を「?」で伏せたタイル地図 + 答え合わせへの3-2-1カウントダウン */
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
    <QuizReelFrame pill="ヒント" pillVariant="outline" sourceLabel={spec.sourceLabel}>
      <h1
        style={{
          fontSize: 54,
          fontWeight: FONT.weight.black,
          lineHeight: 1.3,
          opacity: bodySpring,
          transform: `translateY(${interpolate(bodySpring, [0, 1], [24, 0])}px)`,
        }}
      >
        {spec.hint.headline}
        <br />
        <span style={{ color: QUIZ_COLORS.highlight }}>{spec.hint.accent}</span>
      </h1>
      <p
        style={{
          fontSize: 28,
          color: QUIZ_COLORS.muted,
          marginTop: 12,
          lineHeight: 1.6,
          whiteSpace: "pre-line",
        }}
      >
        {spec.hint.body}
      </p>
      <div style={{ position: "relative", flex: 1, minHeight: 0, marginTop: 20 }}>
        <svg viewBox={`0 0 ${(maxX - minX) * CELL} ${maxY * CELL}`} style={{ width: "100%", height: "100%" }}>
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
                  fontSize={masked ? 34 : rank !== undefined ? 19 : 14}
                  fontWeight={emphasized ? FONT.weight.black : FONT.weight.medium}
                  fill={emphasized ? QUIZ_COLORS.background : QUIZ_COLORS.tileLabel}
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
                fontSize: 260,
                fontWeight: FONT.weight.black,
                color: QUIZ_COLORS.highlight,
                textShadow: `0 0 60px ${QUIZ_COLORS.background}`,
                opacity: interpolate(countdownSpring, [0, 1], [0, 1]),
                transform: `scale(${interpolate(countdownSpring, [0, 1], [1.6, 1])})`,
              }}
            >
              {COUNTDOWN_LABELS[countdownIndex]}
            </span>
          </div>
        )}
      </div>
    </QuizReelFrame>
  );
};
