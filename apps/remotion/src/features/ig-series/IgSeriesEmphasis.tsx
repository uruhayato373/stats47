import React from "react";

import { IG_FONT, IG_SERIES, type IgSeriesId } from "./tokens";

interface IgSeriesEmphasisProps {
  series: IgSeriesId;
  children: React.ReactNode;
}

/**
 * カード内で使う強調インライン文字（シリーズの accent 色）。
 *
 * `accent` は白背景に対してのみ contrast >= 4.5:1 を担保しているため、
 * 白い `IgSeriesCard` の内側でのみ使うこと（シリーズの地色に直接載せない）。
 */
export const IgSeriesEmphasis: React.FC<IgSeriesEmphasisProps> = ({ series, children }) => (
  <b style={{ color: IG_SERIES[series].accent, fontWeight: IG_FONT.weight.black }}>{children}</b>
);
