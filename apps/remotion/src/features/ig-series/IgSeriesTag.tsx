import React from "react";

import { IG_FONT, IG_PILL_SOLID, IG_SERIES, type IgSeriesId } from "./tokens";

interface IgSeriesTagProps {
  series: IgSeriesId;
  /** solid=黒地に白文字（既定） / outline=白地にシリーズ強調色の文字+枠 */
  variant?: "solid" | "outline";
  children: React.ReactNode;
}

/**
 * 角丸ピル型タグ。34px 以上で表示する前提（両 variant とも accent は白背景に対し
 * contrast >= 4.5:1 を満たすようトークン側で担保済みなので、32px 未満でも安全）。
 */
export const IgSeriesTag: React.FC<IgSeriesTagProps> = ({ series, variant = "solid", children }) => {
  const palette = IG_SERIES[series];
  const style: React.CSSProperties =
    variant === "solid"
      ? { backgroundColor: IG_PILL_SOLID.background, color: IG_PILL_SOLID.ink }
      : {
          backgroundColor: "#FFFFFF",
          color: palette.accent,
          border: `3px solid ${palette.accent}`,
        };

  return (
    <span
      style={{
        display: "inline-block",
        padding: "12px 30px",
        borderRadius: 999,
        fontSize: 34,
        fontFamily: IG_FONT.body,
        fontWeight: IG_FONT.weight.black,
        letterSpacing: 1,
        ...style,
      }}
    >
      {children}
    </span>
  );
};
