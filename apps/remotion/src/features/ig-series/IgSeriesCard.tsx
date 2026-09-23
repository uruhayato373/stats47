import React from "react";

import { IG_CARD } from "./tokens";

interface IgSeriesCardProps {
  style?: React.CSSProperties;
  children: React.ReactNode;
}

/**
 * 白カード（direction A 共通）: 白背景・#111 6px枠・28px角丸・12px硬いオフセット影。
 * 密なデータ（ヒントのタイル地図・順位バー・47都道府県表など）を濃彩の地色の上でも
 * 読める状態にするための「白い島」として使う。
 */
export const IgSeriesCard: React.FC<IgSeriesCardProps> = ({ style, children }) => (
  <div
    style={{
      backgroundColor: IG_CARD.background,
      color: IG_CARD.ink,
      border: `${IG_CARD.borderWidth}px solid ${IG_CARD.borderColor}`,
      borderRadius: IG_CARD.radius,
      boxShadow: IG_CARD.shadow,
      ...style,
    }}
  >
    {children}
  </div>
);
