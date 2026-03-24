import React from "react";
import { AbsoluteFill } from "remotion";
import {
  BRAND,
  COLOR_SCHEMES,
  FONT,
  SPACING,
  type ThemeName,
} from "@/shared/themes/brand";
import { OgpSafeZone } from "@/shared/components/layouts/OgpSafeZone";
import { DivergingColorLegend } from "./DivergingColorLegend";
import type { CityPathInfo } from "./types";

interface CompareChoroplethStillProps {
  tokyoPaths: CityPathInfo[];
  osakaPaths: CityPathInfo[];
  maxAbs: number;
  theme?: ThemeName;
  showGuides?: boolean;
}

const MAP_VIEW_SIZE = 800;

/**
 * Composition A: 横並び比較スチル (1200x630)
 *
 * 東京都と大阪府の市区町村別人口増減率を横並びで比較。
 */
export const CompareChoroplethStill: React.FC<CompareChoroplethStillProps> = ({
  tokyoPaths,
  osakaPaths,
  maxAbs,
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
        <AbsoluteFill style={{ opacity: 0.04 }}>
          <div
            style={{
              position: "absolute",
              top: -120,
              left: -80,
              width: 350,
              height: 350,
              borderRadius: "50%",
              border: `2px solid ${BRAND.primary}`,
            }}
          />
          <div
            style={{
              position: "absolute",
              bottom: -120,
              right: -80,
              width: 350,
              height: 350,
              borderRadius: "50%",
              border: `2px solid ${BRAND.danger}`,
            }}
          />
        </AbsoluteFill>

        {/* ビネット */}
        <AbsoluteFill
          style={{
            background: isDark
              ? "radial-gradient(circle, transparent 20%, rgba(15, 23, 42, 0.5) 100%)"
              : "radial-gradient(circle, transparent 20%, rgba(255, 255, 255, 0.3) 100%)",
          }}
        />

        {/* 中央区切り線 */}
        <div
          style={{
            position: "absolute",
            top: 90,
            bottom: 60,
            left: "50%",
            width: 2,
            backgroundColor: isDark
              ? "rgba(255,255,255,0.08)"
              : "rgba(0,0,0,0.06)",
          }}
        />

        {/* ヘッダー */}
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            textAlign: "center",
            padding: `${SPACING.sm}px 0 0`,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
              letterSpacing: 2,
              marginBottom: 4,
            }}
          >
            2025→2045 市区町村 人口増減率
          </div>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 16,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: FONT.weight.black,
                color: BRAND.primaryLight,
              }}
            >
              東京都
            </span>
            <span
              style={{
                fontSize: 22,
                fontWeight: FONT.weight.black,
                color: BRAND.secondary,
                backgroundColor: isDark
                  ? "rgba(245, 158, 11, 0.15)"
                  : "rgba(245, 158, 11, 0.1)",
                padding: "2px 12px",
                borderRadius: 8,
              }}
            >
              VS
            </span>
            <span
              style={{
                fontSize: 32,
                fontWeight: FONT.weight.black,
                color: BRAND.danger,
              }}
            >
              大阪府
            </span>
          </div>
        </div>

        {/* マップエリア */}
        <div
          style={{
            position: "absolute",
            top: 100,
            left: 0,
            right: 0,
            bottom: 55,
            display: "flex",
          }}
        >
          {/* 東京マップ */}
          <div style={{ flex: 1, padding: "0 10px" }}>
            <svg
              viewBox={`0 0 ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
              width="100%"
              height="100%"
              style={{ display: "block" }}
            >
              {tokyoPaths.map((info) => (
                <path
                  key={info.areaCode}
                  d={info.path}
                  fill={info.fill}
                  stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                  strokeWidth={0.8}
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>

          {/* 大阪マップ */}
          <div style={{ flex: 1, padding: "0 10px" }}>
            <svg
              viewBox={`0 0 ${MAP_VIEW_SIZE} ${MAP_VIEW_SIZE}`}
              width="100%"
              height="100%"
              style={{ display: "block" }}
            >
              {osakaPaths.map((info) => (
                <path
                  key={info.areaCode}
                  d={info.path}
                  fill={info.fill}
                  stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
                  strokeWidth={0.8}
                  strokeLinejoin="round"
                />
              ))}
            </svg>
          </div>
        </div>

        {/* フッター: レジェンド + ウォーターマーク */}
        <div
          style={{
            position: "absolute",
            bottom: 10,
            left: SPACING.xl,
            right: SPACING.xl,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <DivergingColorLegend
            width={360}
            height={36}
            maxAbs={maxAbs}
            fontSize={12}
            textColor={colors.muted}
          />
          <div
            style={{
              fontSize: 18,
              fontWeight: FONT.weight.black,
              color: BRAND.primary,
              opacity: 0.6,
            }}
          >
            stats47
          </div>
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};
