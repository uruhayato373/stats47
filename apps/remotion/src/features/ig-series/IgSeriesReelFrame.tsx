import React from "react";
import { AbsoluteFill } from "remotion";

import { IG_FONT, IG_SERIES, type IgSeriesId } from "./tokens";
import { IgSeriesFooter } from "./IgSeriesFooter";
import { IgSeriesTag } from "./IgSeriesTag";

/**
 * IG リール (1080x1920) の安全余白。
 *
 * 右列は IG のいいね/コメント/保存/シェアの縦ボタン列（約14%）、下段はキャプション・
 * プロフィールバー・オーディオ表示（約19%）を避ける。旧 `ranking-quiz-instagram/reel/QuizReelFrame.tsx`
 * から値を継承（参考実績値: `ReelLastPage` top 250 / bottom 400、1080x1920）。
 * area/correlation 等の今後のリールもこの余白を共有する。
 */
const PAD_X = 72;
const SAFE_RIGHT = 150;
const SAFE_TOP = 210;
const SAFE_BOTTOM = 360;
const PILL_HEIGHT = 90;
const FOOTER_HEIGHT = 56;
const FOOTER_GAP = 16;

interface IgSeriesReelFrameProps {
  series: IgSeriesId;
  tag?: string;
  tagVariant?: "solid" | "outline";
  sourceLabel: string;
  children: React.ReactNode;
}

/** IG シリーズ共通のリール用フレーム（安全余白・タグ・ブランド行・出典） */
export const IgSeriesReelFrame: React.FC<IgSeriesReelFrameProps> = ({
  series,
  tag,
  tagVariant = "solid",
  sourceLabel,
  children,
}) => {
  const palette = IG_SERIES[series];
  return (
    <AbsoluteFill
      style={{
        backgroundColor: palette.bg,
        color: palette.ink,
        fontFamily: IG_FONT.body,
        fontWeight: IG_FONT.weight.bold,
      }}
    >
      {tag && (
        <div style={{ position: "absolute", top: SAFE_TOP, left: PAD_X }}>
          <IgSeriesTag series={series} variant={tagVariant}>
            {tag}
          </IgSeriesTag>
        </div>
      )}
      <div
        style={{
          position: "absolute",
          top: SAFE_TOP + (tag ? PILL_HEIGHT : 0),
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
      <IgSeriesFooter
        series={series}
        sourceLabel={sourceLabel}
        left={PAD_X}
        right={SAFE_RIGHT}
        bottom={SAFE_BOTTOM}
      />
    </AbsoluteFill>
  );
};
