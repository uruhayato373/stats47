import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT } from "@/shared";

/** クイズ型カルーセルはダーク固定（琥珀の強調色がダーク前提で設計されている） */
export const QUIZ_COLORS = {
  ...COLOR_SCHEMES.dark,
  highlight: BRAND.secondary,
  /** 正解以外の棒 */
  highlightMuted: "#B45309",
  /** 強調していないタイルの県名 */
  tileLabel: "#475569",
} as const;

const PAD_X = 72;

interface QuizFrameProps {
  pill: string;
  /** solid=塗りつぶし / outline=枠線のみ */
  pillVariant?: "solid" | "outline";
  /** 右下のスワイプ誘導（最終スライドは省略） */
  swipeLabel?: string;
  sourceLabel: string;
  children: React.ReactNode;
}

/** クイズ型カルーセル共通の枠（ラベル・スワイプ誘導・ブランド行・出典） */
export const QuizFrame: React.FC<QuizFrameProps> = ({
  pill,
  pillVariant = "solid",
  swipeLabel,
  sourceLabel,
  children,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: QUIZ_COLORS.background,
      color: QUIZ_COLORS.foreground,
      fontFamily: FONT.family,
      padding: `72px ${PAD_X}px 0`,
    }}
  >
    <div>
      <span
        style={{
          display: "inline-block",
          padding: "10px 26px",
          borderRadius: 999,
          fontSize: 30,
          fontWeight: FONT.weight.black,
          letterSpacing: 1,
          ...(pillVariant === "solid"
            ? { backgroundColor: QUIZ_COLORS.highlight, color: QUIZ_COLORS.background }
            : {
                backgroundColor: QUIZ_COLORS.card,
                color: QUIZ_COLORS.highlight,
                border: `2px solid ${QUIZ_COLORS.highlight}`,
              }),
        }}
      >
        {pill}
      </span>
    </div>
    {children}
    {swipeLabel && (
      <div
        style={{
          position: "absolute",
          right: PAD_X,
          bottom: 110,
          fontSize: 32,
          fontWeight: FONT.weight.black,
          color: QUIZ_COLORS.highlight,
        }}
      >
        {swipeLabel} →
      </div>
    )}
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        right: PAD_X,
        bottom: 44,
        display: "flex",
        justifyContent: "space-between",
        fontSize: 24,
        color: QUIZ_COLORS.muted,
      }}
    >
      <span>
        <b style={{ color: QUIZ_COLORS.accent, fontWeight: FONT.weight.black }}>stats47.jp</b>
        {"　統計で見る都道府県"}
      </span>
      <span>出典: {sourceLabel}</span>
    </div>
  </AbsoluteFill>
);
