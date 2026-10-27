'use client';

import { useEffect, useId, useState } from 'react';

import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';
import { formatValueWithPrecision } from '@stats47/utils';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';

import type { ChartPoint } from './MiniCharts';

/** 実幅を測る前 (SSR・初回描画) に使う幅。測ったあとは実幅に置き換える。 */
const FALLBACK_WIDTH = 400;
/** y 軸の目盛り文字と、線の始点 (最初の年) の間に空ける幅 (px)。 */
const PLOT_START_GAP = 12;

/**
 * 描画先の実幅 (px) を ResizeObserver で測る。viewBox を実幅に合わせ、
 * 目盛りの文字が枠の幅で拡大・縮小されないようにする。
 */
function useMeasuredWidth<T extends Element>() {
  // callback ref で要素を受け取る。データ不足で一度 null を返したあとに描画されても測り始められる。
  const [element, setElement] = useState<T | null>(null);
  const [width, setWidth] = useState(FALLBACK_WIDTH);
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const next = Math.round(entry.contentRect.width);
      if (next > 0) setWidth(next);
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, width] as const;
}

/** A labeled value axis and calendar spacing, with the current observation highlighted. */
export function NumericTrendChart({
  points,
  policy,
  selectedYear,
  label,
  unit,
  formatValue,
}: {
  points: ChartPoint[];
  policy: NumericDomainPolicy;
  selectedYear?: number;
  label: string;
  unit: string;
  formatValue: (value: number) => string;
}) {
  const clipId = useId().replaceAll(':', '');
  const [svgRef, width] = useMeasuredWidth<SVGSVGElement>();
  const data = points
    .filter(
      (point) => Number.isFinite(point.year)
    )
    .sort((a, b) => a.year - b.year);
  const domain = resolveNumericDomain(
    data.map((point) => point.value),
    policy
  );
  if (!domain || data.length < 2) return null;
  const height = 128,
    right = 16,
    top = 12,
    bottom = 24;
  const ticks = [domain[0], (domain[0] + domain[1]) / 2, domain[1]];
  const formatted = ticks.map(formatValue);
  const axisPrecision = Math.max(
    0,
    Math.min(8, Math.ceil(-Math.log10(domain[1] - domain[0])) + 1)
  );
  const tickLabels =
    new Set(formatted).size === ticks.length
      ? formatted
      : ticks.map((value) => formatValueWithPrecision(value, axisPrecision));
  const left = Math.max(
    60,
    Math.max(...tickLabels.map((label) => label.length)) * 7 + 12
  );
  // 描画域 (目盛り線・線・最初の年) の始点を y 軸の目盛り文字から離す。left のままだと最初の点と年の文字が目盛りに接していた。
  const plotLeft = left + PLOT_START_GAP;
  const x = scaleLinear()
    .domain([data[0].year, data[data.length - 1].year])
    .range([plotLeft, width - right]);
  const y = scaleLinear()
    .domain(domain)
    .range([height - bottom, top]);
  const path = line<ChartPoint>()
    .defined((point) => typeof point.value === "number" && Number.isFinite(point.value))
    .x((point) => x(point.year))
    .y((point) => y(point.value))(data);
  const selected = data.find((point) => point.year === selectedYear && typeof point.value === "number" && Number.isFinite(point.value));
  const outside = data.filter(
    (point) => point.value < domain[0] || point.value > domain[1]
  );
  const pointY = (value: number) =>
    y(Math.max(domain[0], Math.min(domain[1], value)));
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className="h-32 w-full"
      role="img"
      aria-label={`${label}の推移。${data[0].year}年から${data[data.length - 1].year}年。単位: ${unit}${outside.length ? `。表示範囲外: ${outside.length}点` : ''}`}
      data-chart="numeric-trend"
      data-domain-min={domain[0]}
      data-domain-max={domain[1]}
    >
      <title>{`${label}の推移 (${unit})`}</title>
      <defs>
        <clipPath id={clipId}>
          <rect
            x={plotLeft}
            y={top - 5}
            width={width - right - plotLeft}
            height={height - bottom - top + 10}
          />
        </clipPath>
      </defs>
      {ticks.map((value, index) => (
        <g key={index}>
          <line
            x1={plotLeft}
            x2={width - right}
            y1={y(value)}
            y2={y(value)}
            className="stroke-border"
            strokeDasharray="3 3"
          />
          <text
            x={left - 8}
            y={y(value) + 4}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize="12"
          >
            {tickLabels[index]}
          </text>
        </g>
      ))}
      <path
        d={path ?? undefined}
        fill="none"
        className="stroke-primary"
        strokeWidth="2"
        clipPath={`url(#${clipId})`}
      />
      {outside.map((point) => (
        <text
          key={point.year}
          x={x(point.year)}
          y={pointY(point.value) + 4}
          textAnchor="middle"
          className="fill-primary"
          fontSize="12"
        >
          <title>{`${point.year}年: ${formatValue(point.value)}${unit}（表示範囲外）`}</title>
          {point.value < domain[0] ? '▼' : '▲'}
        </text>
      ))}
      {selected && (
        <g data-selected-year={selected.year}>
          <title>{`${selected.year}年: ${formatValue(selected.value)}${unit}`}</title>
          <line
            x1={x(selected.year)}
            x2={x(selected.year)}
            y1={top}
            y2={height - bottom}
            className="stroke-muted-foreground"
            strokeDasharray="3 3"
          />
          <circle
            cx={x(selected.year)}
            cy={pointY(selected.value)}
            r="4.5"
            className="fill-primary stroke-background"
            strokeWidth="2"
          />
        </g>
      )}
      <text
        x={plotLeft}
        y={height - 4}
        textAnchor="middle"
        className="fill-muted-foreground"
        fontSize="12"
      >
        {data[0].year}
      </text>
      <text
        x={width - right}
        y={height - 4}
        textAnchor="end"
        className="fill-muted-foreground"
        fontSize="12"
      >
        {data[data.length - 1].year}
      </text>
    </svg>
  );
}
