import React from "react";
import { AbsoluteFill } from "remotion";

import { FONT } from "@/shared";

import { QUIZ_COLORS } from "../QuizFrame";

/**
 * クイズ型リール (1080x1920, 9:16) の安全余白。
 *
 * 右列は IG のいいね/コメント/保存/シェアの縦ボタン列（約14%）、
 * 下段はキャプション・プロフィールバー・オーディオ表示（約19%）を避ける。
 * 参考実績値: `ReelLastPage`（top 250 / bottom 400、1080x1920）。
 */
const PAD_X = 72;
const SAFE_RIGHT = 150;
const SAFE_TOP = 210;
const SAFE_BOTTOM = 360;
const PILL_HEIGHT = 90;
const FOOTER_HEIGHT = 56;
const FOOTER_GAP = 16;

interface QuizReelFrameProps {
  pill?: string;
  /** solid=塗りつぶし / outline=枠線のみ */
  pillVariant?: "solid" | "outline";
  sourceLabel: string;
  children: React.ReactNode;
}

/** クイズ型リール共通の枠（安全余白・ピル・ブランド行・出典） */
export const QuizReelFrame: React.FC<QuizReelFrameProps> = ({
  pill,
  pillVariant = "solid",
  sourceLabel,
  children,
}) => (
  <AbsoluteFill
    style={{
      backgroundColor: QUIZ_COLORS.background,
      color: QUIZ_COLORS.foreground,
      fontFamily: FONT.family,
    }}
  >
    {pill && (
      <div style={{ position: "absolute", top: SAFE_TOP, left: PAD_X }}>
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
    )}
    <div
      style={{
        position: "absolute",
        top: SAFE_TOP + (pill ? PILL_HEIGHT : 0),
        left: PAD_X,
        right: SAFE_RIGHT,
        bottom: SAFE_BOTTOM + FOOTER_HEIGHT + FOOTER_GAP,
        display: "flex",
        flexDirection: "column",
        // 9:16 は縦に余るので、flex: 1 で伸びる場面 (ヒント地図・棒) 以外は縦中央に置く
        justifyContent: "center",
      }}
    >
      {children}
    </div>
    <div
      style={{
        position: "absolute",
        left: PAD_X,
        right: SAFE_RIGHT,
        bottom: SAFE_BOTTOM,
        height: FOOTER_HEIGHT,
        display: "flex",
        alignItems: "center",
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
