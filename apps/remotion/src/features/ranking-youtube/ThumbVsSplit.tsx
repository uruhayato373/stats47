import React from "react";
import { AbsoluteFill } from "remotion";

import { BRAND, COLOR_SCHEMES, FONT, SPACING, type ThemeName } from "@/shared/themes/brand";

interface ThumbVsSplitProps {
  title: string;
  /** 左側の地域 */
  left: { areaName: string; value: string; unit?: string; rank: number };
  /** 右側の地域 */
  right: { areaName: string; value: string; unit?: string; rank: number };
  theme?: ThemeName;
}

/**
 * 対比スプリット型 YouTube サムネイル (1280x720, 16:9)
 *
 * 2つの都道府県を左右に並べて対比するタイプのサムネイル。
 */
export const ThumbVsSplit: React.FC<ThumbVsSplitProps> = ({
  title,
  left,
  right,
  theme = "dark",
}) => {
  const colors = COLOR_SCHEMES[theme];

  const PanelStyle: React.CSSProperties = {
    flex: 1,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.lg,
  };

  return (
    <AbsoluteFill
      style={{
        backgroundColor: colors.background,
        color: colors.foreground,
        fontFamily: FONT.family,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* タイトル */}
      <div
        style={{
          textAlign: "center",
          padding: `${SPACING.md}px ${SPACING.xl}px`,
        }}
      >
        <h1
          style={{
            fontSize: 32,
            fontWeight: FONT.weight.black,
          }}
        >
          {title}
        </h1>
      </div>

      {/* 対比パネル */}
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "stretch",
        }}
      >
        {/* 左パネル */}
        <div style={{ ...PanelStyle, backgroundColor: `${BRAND.primary}15` }}>
          <div style={{ fontSize: 18, color: colors.muted, marginBottom: SPACING.xs }}>
            {left.rank}位
          </div>
          <div style={{ fontSize: 36, fontWeight: FONT.weight.black, marginBottom: SPACING.sm }}>
            {left.areaName}
          </div>
          <div style={{ fontSize: 48, fontWeight: FONT.weight.black, color: BRAND.primaryLight }}>
            {left.value}
          </div>
          {left.unit && (
            <div style={{ fontSize: 18, color: colors.muted, marginTop: SPACING.xs }}>
              {left.unit}
            </div>
          )}
        </div>

        {/* VS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            width: 80,
            fontSize: 28,
            fontWeight: FONT.weight.black,
            color: BRAND.secondary,
          }}
        >
          VS
        </div>

        {/* 右パネル */}
        <div style={{ ...PanelStyle, backgroundColor: `${BRAND.danger}15` }}>
          <div style={{ fontSize: 18, color: colors.muted, marginBottom: SPACING.xs }}>
            {right.rank}位
          </div>
          <div style={{ fontSize: 36, fontWeight: FONT.weight.black, marginBottom: SPACING.sm }}>
            {right.areaName}
          </div>
          <div style={{ fontSize: 48, fontWeight: FONT.weight.black, color: BRAND.danger }}>
            {right.value}
          </div>
          {right.unit && (
            <div style={{ fontSize: 18, color: colors.muted, marginTop: SPACING.xs }}>
              {right.unit}
            </div>
          )}
        </div>
      </div>
    </AbsoluteFill>
  );
};
