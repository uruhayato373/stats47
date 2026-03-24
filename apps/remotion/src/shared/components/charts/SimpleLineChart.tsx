import React, { useMemo } from "react";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND, FONT, type ColorScheme } from "@/shared/themes/brand";

interface DataPoint {
  year: number;
  value: number;
}

interface SimpleLineChartProps {
  data: DataPoint[];
  width: number;
  height: number;
  colors: ColorScheme;
  unit?: string;
  animate?: boolean;
}

/**
 * シンプルなSVG折れ線グラフ
 */
export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  width,
  height,
  colors,
  unit = "",
  animate = true,
}) => {
  const frame = useCurrentFrame();
  
  const padding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const minVal = Math.min(...data.map(d => d.value));
  const maxVal = Math.max(...data.map(d => d.value));
  const valueRange = maxVal - minVal || 1;

  const getX = (index: number) => padding.left + (index / (data.length - 1)) * chartW;
  const getY = (value: number) => padding.top + chartH - ((value - minVal) / valueRange) * chartH;

  const points = useMemo(() => {
    return data.map((d, i) => ({
      x: getX(i),
      y: getY(d.value),
    }));
  }, [data, width, height]);

  // アニメーション用の進捗 (0 to 1)
  const progress = animate 
    ? interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const linePath = useMemo(() => {
    if (points.length < 2) return "";
    return points.reduce((path, p, i) => {
      if (i === 0) return `M ${p.x} ${p.y}`;
      // 線を途中で切る（アニメーション用）
      if (i / (points.length - 1) > progress) return path;
      return `${path} L ${p.x} ${p.y}`;
    }, "");
  }, [points, progress]);

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`}>
      {/* 軸 */}
      <line 
        x1={padding.left} y1={padding.top + chartH} 
        x2={padding.left + chartW} y2={padding.top + chartH} 
        stroke={colors.border} strokeWidth={2} 
      />
      <line 
        x1={padding.left} y1={padding.top} 
        x2={padding.left} y2={padding.top + chartH} 
        stroke={colors.border} strokeWidth={2} 
      />

      {/* 目盛り (簡易) */}
      <text 
        x={padding.left - 10} y={padding.top} 
        textAnchor="end" dominantBaseline="middle" 
        fill={colors.muted} fontSize={14}
      >
        {maxVal.toLocaleString()}{unit}
      </text>
      <text 
        x={padding.left - 10} y={padding.top + chartH} 
        textAnchor="end" dominantBaseline="middle" 
        fill={colors.muted} fontSize={14}
      >
        {minVal.toLocaleString()}{unit}
      </text>

      {/* グラデーション */}
      <defs>
        <linearGradient id="line-gradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={BRAND.primary} stopOpacity={0.3} />
          <stop offset="100%" stopColor={BRAND.primary} stopOpacity={0} />
        </linearGradient>
      </defs>

      {/* 折れ線の下の塗りつぶし */}
      {points.length >= 2 && (
        <path
          d={`${linePath} L ${getX(Math.floor(progress * (data.length-1)))} ${padding.top + chartH} L ${padding.left} ${padding.top + chartH} Z`}
          fill="url(#line-gradient)"
        />
      )}

      {/* 折れ線本体 */}
      <path
        d={linePath}
        fill="none"
        stroke={BRAND.primary}
        strokeWidth={4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* データポイントの点 */}
      {points.map((p, i) => {
        if (i / (points.length - 1) > progress) return null;
        return (
          <circle 
            key={i} cx={p.x} cy={p.y} r={6} 
            fill={BRAND.primary} stroke={colors.background} strokeWidth={2} 
          />
        );
      })}

      {/* 年ラベル */}
      {data.map((d, i) => (
        i % (Math.ceil(data.length / 5)) === 0 && (
          <text
            key={i} x={getX(i)} y={padding.top + chartH + 25}
            textAnchor="middle" fill={colors.muted} fontSize={12}
          >
            {d.year}
          </text>
        )
      ))}
    </svg>
  );
};
