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

export interface ScatterPoint {
  areaName: string;
  x: number;
  y: number;
}

interface CorrelationScatterOgpProps {
  titleX: string;
  titleY: string;
  unitX: string;
  unitY: string;
  points: ScatterPoint[];
  pearsonR: number;
  theme?: ThemeName;
  showGuides?: boolean;
}

/**
 * 相関散布図 OGP 画像 (1200x630)
 *
 * 47都道府県の散布図 + 回帰直線 + 相関係数 r。
 * X 投稿用のコンテンツ画像。
 */
export const CorrelationScatterOgp: React.FC<CorrelationScatterOgpProps> = ({
  titleX,
  titleY,
  unitX,
  unitY,
  points,
  pearsonR,
  theme = "dark",
  showGuides = false,
}) => {
  const colors = COLOR_SCHEMES[theme];
  const isDark = theme === "dark";

  // チャート描画エリア
  const chartLeft = 100;
  const chartTop = 100;
  const chartWidth = 780;
  const chartHeight = 420;

  // データ範囲
  const xValues = points.map((p) => p.x);
  const yValues = points.map((p) => p.y);
  const xMin = Math.min(...xValues);
  const xMax = Math.max(...xValues);
  const yMin = Math.min(...yValues);
  const yMax = Math.max(...yValues);

  // パディング（端に点が来ないよう10%余裕）
  const xRange = xMax - xMin || 1;
  const yRange = yMax - yMin || 1;
  const xPadded = { min: xMin - xRange * 0.1, max: xMax + xRange * 0.1 };
  const yPadded = { min: yMin - yRange * 0.1, max: yMax + yRange * 0.1 };

  // 座標変換
  const toSvgX = (val: number) =>
    chartLeft +
    ((val - xPadded.min) / (xPadded.max - xPadded.min)) * chartWidth;
  const toSvgY = (val: number) =>
    chartTop +
    chartHeight -
    ((val - yPadded.min) / (yPadded.max - yPadded.min)) * chartHeight;

  // 回帰直線
  const n = points.length;
  const sumX = xValues.reduce((a, b) => a + b, 0);
  const sumY = yValues.reduce((a, b) => a + b, 0);
  const sumXY = points.reduce((a, p) => a + p.x * p.y, 0);
  const sumX2 = xValues.reduce((a, b) => a + b * b, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX || 1);
  const intercept = (sumY - slope * sumX) / (n || 1);

  const regressionY = (x: number) => slope * x + intercept;
  const lineX1 = xPadded.min;
  const lineX2 = xPadded.max;

  // 相関強度の表現
  const absR = Math.abs(pearsonR);
  const rStrength =
    absR >= 0.7
      ? "強い相関"
      : absR >= 0.4
        ? "中程度の相関"
        : absR >= 0.2
          ? "弱い相関"
          : "ほぼ無相関";

  const rColor =
    absR >= 0.7
      ? BRAND.danger
      : absR >= 0.4
        ? BRAND.secondary
        : colors.muted;

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
        {/* ビネット効果 */}
        <AbsoluteFill
          style={{
            background: isDark
              ? "radial-gradient(circle, transparent 30%, rgba(15, 23, 42, 0.4) 100%)"
              : "radial-gradient(circle, transparent 30%, rgba(255, 255, 255, 0.2) 100%)",
          }}
        />

        {/* SVG チャート */}
        <svg
          width={1200}
          height={630}
          style={{ position: "absolute", inset: 0 }}
        >
          {/* グリッド線 */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => {
            const x = chartLeft + t * chartWidth;
            const y = chartTop + t * chartHeight;
            return (
              <React.Fragment key={t}>
                <line
                  x1={chartLeft}
                  y1={y}
                  x2={chartLeft + chartWidth}
                  y2={y}
                  stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                  strokeWidth={1}
                />
                <line
                  x1={x}
                  y1={chartTop}
                  x2={x}
                  y2={chartTop + chartHeight}
                  stroke={isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)"}
                  strokeWidth={1}
                />
              </React.Fragment>
            );
          })}

          {/* 軸 */}
          <line
            x1={chartLeft}
            y1={chartTop + chartHeight}
            x2={chartLeft + chartWidth}
            y2={chartTop + chartHeight}
            stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
            strokeWidth={1.5}
          />
          <line
            x1={chartLeft}
            y1={chartTop}
            x2={chartLeft}
            y2={chartTop + chartHeight}
            stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.2)"}
            strokeWidth={1.5}
          />

          {/* 回帰直線 */}
          <line
            x1={toSvgX(lineX1)}
            y1={toSvgY(regressionY(lineX1))}
            x2={toSvgX(lineX2)}
            y2={toSvgY(regressionY(lineX2))}
            stroke={BRAND.danger}
            strokeWidth={2.5}
            strokeDasharray="8 4"
            opacity={0.8}
          />

          {/* データポイント */}
          {points.map((point) => (
            <circle
              key={point.areaName}
              cx={toSvgX(point.x)}
              cy={toSvgY(point.y)}
              r={5}
              fill={isDark ? BRAND.primaryLight : BRAND.primary}
              opacity={0.7}
              stroke={isDark ? "rgba(255,255,255,0.3)" : "rgba(255,255,255,0.8)"}
              strokeWidth={1}
            />
          ))}

          {/* X軸ラベル */}
          <text
            x={chartLeft + chartWidth / 2}
            y={chartTop + chartHeight + 48}
            textAnchor="middle"
            fill={colors.muted}
            fontSize={16}
            fontWeight={FONT.weight.bold}
            fontFamily={FONT.family}
          >
            {titleX}
            {unitX ? ` (${unitX})` : ""}
          </text>

          {/* Y軸ラベル */}
          <text
            x={chartLeft - 16}
            y={chartTop + chartHeight / 2}
            textAnchor="middle"
            fill={colors.muted}
            fontSize={16}
            fontWeight={FONT.weight.bold}
            fontFamily={FONT.family}
            transform={`rotate(-90, ${chartLeft - 16}, ${chartTop + chartHeight / 2})`}
          >
            {titleY}
            {unitY ? ` (${unitY})` : ""}
          </text>
        </svg>

        {/* 右上: 相関係数パネル */}
        <div
          style={{
            position: "absolute",
            top: 30,
            right: 40,
            backgroundColor: isDark
              ? "rgba(15, 23, 42, 0.9)"
              : "rgba(255, 255, 255, 0.95)",
            backdropFilter: "blur(10px)",
            padding: `${SPACING.sm}px ${SPACING.md}px`,
            borderRadius: 16,
            border: `1px solid ${isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.1)"}`,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 14,
              fontWeight: FONT.weight.bold,
              color: colors.muted,
            }}
          >
            相関係数
          </div>
          <div
            style={{
              fontSize: 40,
              fontWeight: FONT.weight.black,
              color: rColor,
              lineHeight: 1,
              fontFamily: FONT.familyMono,
            }}
          >
            r = {pearsonR >= 0 ? "+" : ""}
            {pearsonR.toFixed(3)}
          </div>
          <div
            style={{
              fontSize: 14,
              fontWeight: FONT.weight.bold,
              color: rColor,
            }}
          >
            {rStrength}
          </div>
        </div>

        {/* 左上: タイトル */}
        <div
          style={{
            position: "absolute",
            top: 20,
            left: 40,
            display: "flex",
            flexDirection: "column",
            gap: 4,
          }}
        >
          <div
            style={{
              fontSize: 16,
              fontWeight: FONT.weight.bold,
              color: isDark ? colors.accent : BRAND.primary,
              letterSpacing: "0.1em",
            }}
          >
            相関分析
          </div>
          <div
            style={{
              fontSize: 22,
              fontWeight: FONT.weight.black,
              color: colors.foreground,
              lineHeight: 1.2,
              maxWidth: 600,
            }}
          >
            {titleX} × {titleY}
          </div>
        </div>

        {/* ウォーターマーク */}
        <div
          style={{
            position: "absolute",
            bottom: 12,
            right: 20,
            fontSize: 18,
            fontWeight: FONT.weight.black,
            color: BRAND.primary,
            opacity: 0.5,
          }}
        >
          stats47
        </div>
      </AbsoluteFill>
    </OgpSafeZone>
  );
};
