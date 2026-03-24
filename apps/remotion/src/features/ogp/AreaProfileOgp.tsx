import React from "react";
import { AbsoluteFill } from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ColorScheme,
  type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import type { AreaProfileIndicator } from "@/shared/types/area-profile";

export type { AreaProfileIndicator } from "@/shared/types/area-profile";

interface AreaProfileOgpProps {
  areaName: string;
  strengths: AreaProfileIndicator[];
  weaknesses: AreaProfileIndicator[];
  theme?: ThemeName;
  showGuides?: boolean;
}

/**
 * 地域プロファイル OGP 画像 (1200x630)
 *
 * 都道府県の強み TOP3 / 弱み TOP3 を左右に配置。
 * X 投稿用のコンテンツ画像。
 */
export const AreaProfileOgp: React.FC<AreaProfileOgpProps> = ({
  areaName,
  strengths,
  weaknesses,
  theme = "dark",
  showGuides = false,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  return (
    <OgpSafeZone showGuides={showGuides}>
      <AbsoluteFill
        style={{
          backgroundColor: colors.background,
          color: colors.foreground,
          fontFamily: FONT.family,
          overflow: "hidden",
        }}
      >
        {/* 装飾的な背景要素 */}
        <AbsoluteFill style={{ opacity: 0.08 }}>
          <div
            style={{
              position: "absolute",
              top: -80,
              left: -80,
              width: 350,
              height: 350,
              borderRadius: "50%",
              border: `2px solid ${BRAND.success}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -120,
              right: -60,
              width: 500,
              height: 500,
              borderRadius: "50%",
              border: `1px solid ${BRAND.danger}`,
            }}
          />
        </AbsoluteFill>

        {/* ビネット効果 */}
        <AbsoluteFill
          style={{
            background: isDark
              ? "radial-gradient(circle, transparent 20%, rgba(15, 23, 42, 0.6) 100%)"
              : "radial-gradient(circle, transparent 20%, rgba(255, 255, 255, 0.3) 100%)",
          }}
        />

        {/* メインコンテンツ */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            padding: `${SPACING.lg}px ${SPACING.xl}px`,
          }}
        >
          {/* ヘッダー */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
              marginBottom: SPACING.md,
            }}
          >
            <div
              style={{
                fontSize: 20,
                fontWeight: FONT.weight.bold,
                color: isDark ? colors.accent : BRAND.primary,
                letterSpacing: "0.1em",
              }}
            >
              地域プロファイル
            </div>
            <h1
              style={{
                fontSize: 48,
                fontWeight: FONT.weight.black,
                color: colors.foreground,
                margin: 0,
                lineHeight: 1.1,
              }}
            >
              {areaName}
            </h1>
          </div>

          {/* 強み・弱みの2カラム */}
          <div
            style={{
              flex: 1,
              display: "flex",
              gap: SPACING.md,
            }}
          >
            {/* 強み */}
            <IndicatorColumn
              title="強み"
              titleColor={BRAND.success}
              items={strengths}
              isDark={isDark}
              colors={colors}
            />

            {/* 弱み */}
            <IndicatorColumn
              title="弱み"
              titleColor={BRAND.danger}
              items={weaknesses}
              isDark={isDark}
              colors={colors}
            />
          </div>
        </div>

        {/* ウォーターマーク */}
        <div
          style={{
            position: "absolute",
            bottom: 20,
            right: 30,
            fontSize: 20,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            opacity: 0.6,
          }}
        >
          stats47
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};

function IndicatorColumn({
  title,
  titleColor,
  items,
  isDark,
  colors,
}: {
  title: string;
  titleColor: string;
  items: AreaProfileIndicator[];
  isDark: boolean;
  colors: ColorScheme;
}) {
  return (
    <div
      style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: SPACING.sm,
      }}
    >
      {/* セクションタイトル */}
      <div
        style={{
          fontSize: 24,
          fontWeight: FONT.weight.black,
          color: titleColor,
          textAlign: "center",
          letterSpacing: "0.05em",
        }}
      >
        {title} TOP3
      </div>

      {/* アイテム */}
      {items.slice(0, 3).map((item, index) => (
        <div
          key={item.label}
          style={{
            backgroundColor: isDark
              ? "rgba(30, 41, 59, 0.85)"
              : "rgba(255, 255, 255, 0.9)",
            backdropFilter: "blur(10px)",
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            borderRadius: 16,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.1)" : "rgba(0,0,0,0.08)"}`,
            borderLeft: `4px solid ${titleColor}`,
            display: "flex",
            flexDirection: "column",
            gap: 4,
            flex: 1,
          }}
        >
          {/* 順位 + 指標名 */}
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 28,
                fontWeight: FONT.weight.black,
                color: titleColor,
                lineHeight: 1,
                minWidth: 48,
              }}
            >
              {index + 1}.
            </span>
            <span
              style={{
                fontSize: 20,
                fontWeight: FONT.weight.bold,
                color: colors.foreground,
                lineHeight: 1.2,
              }}
            >
              {item.label}
            </span>
          </div>
          {/* 値 */}
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 4,
              justifyContent: "flex-end",
            }}
          >
            <span
              style={{
                fontSize: 14,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}
            >
              全国{item.rank}位
            </span>
            <span
              style={{
                fontSize: 24,
                fontWeight: FONT.weight.black,
                color: BRAND.secondary,
              }}
            >
              {item.value.toLocaleString()}
            </span>
            <span
              style={{
                fontSize: 14,
                fontWeight: FONT.weight.bold,
                color: colors.muted,
              }}
            >
              {item.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
