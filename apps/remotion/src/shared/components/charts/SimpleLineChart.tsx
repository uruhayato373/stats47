import { resolveChartDomain, type NumericDomainPolicy } from '@stats47/types';
import React from "react";
import { line, area } from "d3-shape";
import { interpolate, useCurrentFrame } from "remotion";
import { BRAND, type ColorScheme } from "@/shared/themes/brand";

interface DataPoint {
  year: number;
  value: number | null;
}

interface SimpleLineChartProps {
  domainPolicy?: NumericDomainPolicy;
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
  domainPolicy = {mode:"extent"},
}) => {
  const frame = useCurrentFrame();
  
  const padding = { top: 40, right: 40, bottom: 40, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  const domain = resolveChartDomain(data.map(d=>d.value), domainPolicy);
  const [minVal, maxVal] = domain ?? [0, 1];
  const valueRange = maxVal - minVal || 1;

  const years = resolveChartDomain(data.map(d => d.year), {mode: 'extent'});
  const getX = (index: number) => padding.left + (years ? (data[index].year - years[0]) / (years[1] - years[0]) : 0.5) * chartW;
  const getY = (value: number) => padding.top + chartH - ((value - minVal) / valueRange) * chartH;

  const points = data.map((d, i) => ({ x: getX(i), y: typeof d.value === 'number' && Number.isFinite(d.value) ? getY(d.value) : NaN }));

  // アニメーション用の進捗 (0 to 1)
  const progress = animate 
    ? interpolate(frame, [0, 60], [0, 1], { extrapolateRight: "clamp" })
    : 1;

  const visible = points.slice(0, Math.floor(progress * Math.max(0, points.length - 1)) + 1);
  const valid = (p: {x:number;y:number}) => Number.isFinite(p.x) && Number.isFinite(p.y);
  const linePath = line<{x:number;y:number}>().defined(valid).x(p=>p.x).y(p=>p.y)(visible) ?? '';
  const areaPath = area<{x:number;y:number}>().defined(valid).x(p=>p.x).y0(padding.top + chartH).y1(p=>p.y)(visible) ?? '';

  if (!domain) return null;
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
          d={areaPath}
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
        if (!valid(p) || i / Math.max(1, points.length - 1) > progress) return null;
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
