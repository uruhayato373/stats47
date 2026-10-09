import { useId } from 'react';

import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';
import { formatValueWithPrecision } from '@stats47/utils';
import { scaleLinear } from 'd3-scale';
import { line } from 'd3-shape';

import type { ChartPoint } from './MiniCharts';

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
  const data = points
    .filter(
      (point) => Number.isFinite(point.value) && Number.isFinite(point.year)
    )
    .sort((a, b) => a.year - b.year);
  const domain = resolveNumericDomain(
    data.map((point) => point.value),
    policy
  );
  if (!domain || data.length < 2) return null;
  const width = 400,
    height = 128,
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
  const x = scaleLinear()
    .domain([data[0].year, data[data.length - 1].year])
    .range([left, width - right]);
  const y = scaleLinear()
    .domain(domain)
    .range([height - bottom, top]);
  const path = line<ChartPoint>()
    .x((point) => x(point.year))
    .y((point) => y(point.value))(data);
  const selected = data.find((point) => point.year === selectedYear);
  const outside = data.filter(
    (point) => point.value < domain[0] || point.value > domain[1]
  );
  const pointY = (value: number) =>
    y(Math.max(domain[0], Math.min(domain[1], value)));
  return (
    <svg
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
            x={left}
            y={top - 5}
            width={width - right - left}
            height={height - bottom - top + 10}
          />
        </clipPath>
      </defs>
      {ticks.map((value, index) => (
        <g key={index}>
          <line
            x1={left}
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
        x={left}
        y={height - 4}
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
