import React from "react";
import { interpolateRdBu } from "d3-scale-chromatic";
import { FONT } from "@/shared/themes/brand";

interface DivergingColorLegendProps {
  width?: number;
  height?: number;
  maxAbs: number;
  fontSize?: number;
  textColor?: string;
}

/**
 * Diverging カラーレジェンド（SVG グラデーションバー）
 *
 * 減少 ← 1.0 → 増加 の横方向グラデーション。
 */
export const DivergingColorLegend: React.FC<DivergingColorLegendProps> = ({
  width = 400,
  height = 40,
  maxAbs,
  fontSize = 14,
  textColor = "#94A3B8",
}) => {
  const barHeight = 12;
  const barY = 4;
  const labelY = barY + barHeight + fontSize + 4;
  const stops = 11;

  const gradientId = "diverging-legend-gradient";

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1" y1="0" y2="0">
          {Array.from({ length: stops }, (_, i) => {
            const t = i / (stops - 1);
            return (
              <stop
                key={i}
                offset={`${t * 100}%`}
                stopColor={interpolateRdBu(t)}
              />
            );
          })}
        </linearGradient>
      </defs>

      <rect
        x={0}
        y={barY}
        width={width}
        height={barHeight}
        rx={4}
        fill={`url(#${gradientId})`}
      />

      {/* Labels */}
      <text
        x={0}
        y={labelY}
        fontSize={fontSize}
        fill={textColor}
        fontFamily={FONT.family}
        textAnchor="start"
      >
        {`-${((maxAbs) * 100).toFixed(0)}%`}
      </text>
      <text
        x={width / 2}
        y={labelY}
        fontSize={fontSize}
        fill={textColor}
        fontFamily={FONT.family}
        textAnchor="middle"
        fontWeight={FONT.weight.bold}
      >
        ±0%
      </text>
      <text
        x={width}
        y={labelY}
        fontSize={fontSize}
        fill={textColor}
        fontFamily={FONT.family}
        textAnchor="end"
      >
        {`+${((maxAbs) * 100).toFixed(0)}%`}
      </text>
    </svg>
  );
};
