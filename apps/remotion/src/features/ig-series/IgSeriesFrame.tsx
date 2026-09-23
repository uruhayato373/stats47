import React from "react";
import { AbsoluteFill } from "remotion";

import { IG_FONT, IG_SERIES, type IgSeriesId } from "./tokens";
import { IgSeriesFooter } from "./IgSeriesFooter";
import { IgSeriesTag } from "./IgSeriesTag";

const PAD_X = 72;
const PAD_TOP = 72;
const FOOTER_BOTTOM = 44;
/** スワイプ誘導は 32px（「32px 以上」の大文字扱い） */
const SWIPE_FONT_SIZE = 32;

interface IgSeriesFrameProps {
  series: IgSeriesId;
  tag?: string;
  /** solid=黒地に白文字（既定） / outline=白地にシリーズ強調色 */
  tagVariant?: "solid" | "outline";
  /** 右下のスワイプ誘導（最終スライドは省略） */
  swipeLabel?: string;
  sourceLabel: string;
  children: React.ReactNode;
}

/**
 * IG シリーズ共通の静止画/カルーセル用フレーム（4:5 等）。
 * シリーズの地色を全面に敷き、左上にタグ、下部にスワイプ誘導とブランド行を固定配置する。
 * リール (9:16・IG セーフゾーン付き) は `IgSeriesReelFrame` を使う。
 */
export const IgSeriesFrame: React.FC<IgSeriesFrameProps> = ({
  series,
  tag,
  tagVariant = "solid",
  swipeLabel,
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
        padding: `${PAD_TOP}px ${PAD_X}px 0`,
      }}
    >
      {tag && (
        <div>
          <IgSeriesTag series={series} variant={tagVariant}>
            {tag}
          </IgSeriesTag>
        </div>
      )}
      {children}
      {swipeLabel && (
        <div
          style={{
            position: "absolute",
            right: PAD_X,
            bottom: 110,
            fontSize: SWIPE_FONT_SIZE,
            fontFamily: IG_FONT.body,
            fontWeight: IG_FONT.weight.black,
            color: palette.ink,
          }}
        >
          {swipeLabel} →
        </div>
      )}
      <IgSeriesFooter series={series} sourceLabel={sourceLabel} left={PAD_X} right={PAD_X} bottom={FOOTER_BOTTOM} />
    </AbsoluteFill>
  );
};
