import React from "react";

import { IG_FONT, IG_SERIES, type IgSeriesId } from "./tokens";

interface IgSeriesFooterProps {
  series: IgSeriesId;
  sourceLabel: string;
  /** 絶対配置の left/right/bottom（カルーセルとリールで安全余白が異なるため呼び出し側が指定） */
  left: number;
  right: number;
  bottom: number;
}

/**
 * ブランド行（左: stats47.jp / 右: 出典）。地色に直接載る 26px の小さい文字なので、
 * `palette.inkSmall`（32px 未満で contrast >= 4.5:1 を満たす色）を使う。
 */
export const IgSeriesFooter: React.FC<IgSeriesFooterProps> = ({
  series,
  sourceLabel,
  left,
  right,
  bottom,
}) => {
  const palette = IG_SERIES[series];
  return (
    <div
      style={{
        position: "absolute",
        left,
        right,
        bottom,
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        fontSize: 26,
        fontFamily: IG_FONT.body,
        fontWeight: IG_FONT.weight.black,
        color: palette.inkSmall,
      }}
    >
      <span>{"stats47.jp　統計で見る都道府県"}</span>
      <span>出典: {sourceLabel}</span>
    </div>
  );
};
