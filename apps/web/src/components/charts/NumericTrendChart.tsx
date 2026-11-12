'use client';

import { useEffect, useId, useState, type KeyboardEvent, type PointerEvent } from 'react';

import { resolveNumericDomain, type NumericDomainPolicy } from '@stats47/types';
import { formatValueWithPrecision } from '@stats47/utils';
import { useD3Tooltip, type TooltipSeriesItem } from '@stats47/visualization';
import { bisector } from 'd3-array';
import { scaleLinear } from 'd3-scale';
import { area, line } from 'd3-shape';

import type { ChartPoint } from './MiniCharts';

/** 実幅を測る前 (SSR・初回描画) に使う幅。測ったあとは実幅に置き換える。 */
const FALLBACK_WIDTH = 400;
/** 既定の高さ (px)。fillHeight のときは最小の高さになる (h-32 と同じ)。 */
const DEFAULT_HEIGHT = 128;
/** y 軸の目盛り文字と、線の始点 (最初の年) の間に空ける幅 (px)。 */
const PLOT_START_GAP = 12;
/** y 軸の目盛りの数の目安。d3 の nice / ticks が切りのよい値 (1・2・5 の倍数) に丸める。 */
const Y_TICK_COUNT = 4;

/**
 * 描画先の実寸 (px) を ResizeObserver で測る。viewBox を実寸に合わせ、
 * 目盛りの文字が枠の大きさで拡大・縮小されないようにする。
 */
function useMeasuredSize<T extends Element>() {
  // callback ref で要素を受け取る。データ不足で一度 null を返したあとに描画されても測り始められる。
  const [element, setElement] = useState<T | null>(null);
  const [size, setSize] = useState({ width: FALLBACK_WIDTH, height: DEFAULT_HEIGHT });
  useEffect(() => {
    if (!element || typeof ResizeObserver === 'undefined') return;
    const observer = new ResizeObserver(([entry]) => {
      const width = Math.round(entry.contentRect.width);
      const height = Math.round(entry.contentRect.height);
      if (width > 0) setSize({ width, height: Math.max(DEFAULT_HEIGHT, height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, [element]);
  return [setElement, size] as const;
}

/** Calendar-spaced observations, optional total area, and exact values on interaction. */
export function NumericTrendChart({
  points,
  policy,
  selectedYear,
  label,
  unit,
  formatValue,
  fillHeight = false,
  showAxes = true,
  areaSeries,
  lineColor = 'hsl(var(--primary))',
  formatYear = (year) => `${year}年`,
  tooltipItems,
}: {
  points: ChartPoint[];
  policy: NumericDomainPolicy;
  selectedYear?: number;
  label: string;
  unit: string;
  formatValue: (value: number) => string;
  /** 親 (flex の列) の残りの高さいっぱいに描く。カードの下に空白を残さないため */
  fillHeight?: boolean;
  /** カード内では軸の文字を省き、年と完全値をツールチップで読む。 */
  showAxes?: boolean;
  /** domainPolicy がある面は独立した縦軸を使う。欠測は NaN にして線をつながない。 */
  areaSeries?: { label: string; points: ChartPoint[]; color: string; domainPolicy?: NumericDomainPolicy };
  lineColor?: string;
  formatYear?: (year: number) => string;
  tooltipItems?: (point: ChartPoint) => TooltipSeriesItem[];
}) {
  const clipId = useId().replaceAll(':', '');
  const [svgRef, measured] = useMeasuredSize<SVGSVGElement>();
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const { showStackedTooltip, hideTooltip } = useD3Tooltip();
  useEffect(() => { hideTooltip(); }, [points, areaSeries, hideTooltip]);
  const width = measured.width;
  const data = points
    .filter(
      (point) => Number.isFinite(point.year)
    )
    .sort((a, b) => a.year - b.year);
  const areaValues = new Map(areaSeries?.points.map((point) => [point.year, point.value]));
  const hasIndependentArea = areaSeries?.domainPolicy !== undefined;
  const domain = resolveNumericDomain(
    [...data.map((point) => point.value), ...(areaSeries && !hasIndependentArea ? [...areaValues.values(), 0] : [])],
    policy
  );
  if (!domain || data.length < 2) return null;
  const areaDomain = areaSeries?.domainPolicy
    ? resolveNumericDomain([...areaValues.values()], areaSeries.domainPolicy) ?? domain
    : domain;
  const height = fillHeight ? measured.height : DEFAULT_HEIGHT,
    right = 16,
    top = 12,
    bottom = showAxes ? 28 : 12;
  // 目盛りは切りのよい値にする。固定範囲 (fixed) は範囲そのものを意味として持つので広げない。
  const y = scaleLinear()
    .domain(domain)
    .range([height - bottom, top]);
  if (policy.mode !== 'fixed') y.nice(Y_TICK_COUNT);
  const areaY = hasIndependentArea
    ? scaleLinear().domain(areaDomain).range([height - bottom, top])
    : y;
  if (hasIndependentArea && areaSeries?.domainPolicy?.mode !== 'fixed') areaY.nice(Y_TICK_COUNT);
  const ticks = y.ticks(Y_TICK_COUNT);
  const formatted = ticks.map(formatValue);
  const tickStep = ticks.length > 1 ? Math.abs(ticks[1] - ticks[0]) : domain[1] - domain[0];
  const axisPrecision = Math.max(
    0,
    Math.min(8, Math.ceil(-Math.log10(tickStep)))
  );
  const tickLabels =
    new Set(formatted).size === ticks.length
      ? formatted
      : ticks.map((value) => formatValueWithPrecision(value, axisPrecision));
  const left = showAxes ? Math.max(
    60,
    Math.max(...tickLabels.map((label) => label.length)) * 7 + 12
  ) : 0;
  // 描画域 (目盛り線・線・最初の年) の始点を y 軸の目盛り文字から離す。left のままだと最初の点と年の文字が目盛りに接していた。
  const plotLeft = left + PLOT_START_GAP;
  const x = scaleLinear()
    .domain([data[0].year, data[data.length - 1].year])
    .range([plotLeft, width - right]);
  const path = line<ChartPoint>()
    .defined((point) => typeof point.value === "number" && Number.isFinite(point.value))
    .x((point) => x(point.year))
    .y((point) => y(point.value))(data);
  const areaGenerator = area<ChartPoint>()
    .defined((point) => Number.isFinite(areaValues.get(point.year)))
    .x((point) => x(point.year))
    .y0(areaY(0))
    .y1((point) => areaY(areaValues.get(point.year)!));
  const areaPath = areaGenerator(data);
  const areaOutlinePath = areaGenerator.lineY1()(data);
  const selected = data.find((point) => point.year === selectedYear && typeof point.value === "number" && Number.isFinite(point.value));
  const outside = [
    ...data.map((point) => ({ ...point, label, color: lineColor, domain, scale: y })),
    ...(areaSeries?.points.map((point) => ({ ...point, label: areaSeries.label, color: areaSeries.color, domain: areaDomain, scale: areaY })) ?? []),
  ].filter((point) => Number.isFinite(point.value) && (point.value < point.domain[0] || point.value > point.domain[1]));
  const pointY = (value: number) =>
    y(Math.max(domain[0], Math.min(domain[1], value)));
  const areaPointY = (value: number) =>
    areaY(Math.max(areaDomain[0], Math.min(areaDomain[1], value)));
  const validData = data.filter((point) => Number.isFinite(point.value));
  const hovered = validData.find((point) => point.year === hoveredYear);
  const active = hovered ?? selected ?? validData[validData.length - 1];
  const itemsFor = (point: ChartPoint): TooltipSeriesItem[] => tooltipItems?.(point) ?? [
    ...(areaSeries && Number.isFinite(areaValues.get(point.year))
      ? [{ name: areaSeries.label, value: areaValues.get(point.year)!, color: areaSeries.color }]
      : []),
    { name: label, value: point.value, color: lineColor },
  ];
  const showPoint = (point: ChartPoint, event: MouseEvent) => {
    setHoveredYear(point.year);
    showStackedTooltip(event, formatYear(point.year), itemsFor(point), { unit, formatter: formatValue });
  };
  const handlePointer = (event: PointerEvent<SVGSVGElement>) => {
    if (!validData.length) return;
    const bounds = event.currentTarget.getBoundingClientRect();
    const localX = (event.clientX - bounds.left) * width / (bounds.width || width);
    const index = bisector<ChartPoint, number>((point) => point.year).center(validData, x.invert(localX));
    showPoint(validData[index], event.nativeEvent);
  };
  const showKeyboardPoint = (point: ChartPoint, target: SVGRectElement) => {
    const bounds = target.ownerSVGElement!.getBoundingClientRect();
    showPoint(point, new MouseEvent('mousemove', {
      clientX: bounds.left + x(point.year) * (bounds.width || width) / width,
      clientY: bounds.top + top,
    }));
  };
  const handleKey = (event: KeyboardEvent<SVGRectElement>) => {
    if (!active || !['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
    event.preventDefault();
    const index = validData.indexOf(active);
    const next = event.key === 'Home' ? 0 : event.key === 'End' ? validData.length - 1
      : Math.max(0, Math.min(validData.length - 1, index + (event.key === 'ArrowRight' ? 1 : -1)));
    showKeyboardPoint(validData[next], event.currentTarget);
  };
  const dismiss = () => { setHoveredYear(null); hideTooltip(); };
  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      className={fillHeight ? 'min-h-32 w-full flex-1' : 'h-32 w-full'}
      role="img"
      aria-label={`${label}の推移。${formatYear(data[0].year)}から${formatYear(data[data.length - 1].year)}。単位: ${unit}${hasIndependentArea ? `。${areaSeries?.label}と${label}は別の縦軸スケール` : ''}${outside.length ? `。表示範囲外: ${outside.length}点` : ''}`}
      data-chart="numeric-trend"
      data-domain-min={domain[0]}
      data-domain-max={domain[1]}
      data-area-domain-min={areaSeries ? areaDomain[0] : undefined}
      data-area-domain-max={areaSeries ? areaDomain[1] : undefined}
      onPointerMove={handlePointer}
      onPointerDown={handlePointer}
      onPointerLeave={dismiss}
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
          {showAxes && <text
            x={left - 8}
            y={y(value) + 4}
            textAnchor="end"
            className="fill-muted-foreground"
            fontSize="12"
          >
            {tickLabels[index]}
          </text>}
        </g>
      ))}
      {areaSeries && <g clipPath={`url(#${clipId})`}>
        <path d={areaPath ?? undefined} fill={areaSeries.color} fillOpacity="0.14" data-series="total" />
        <path d={areaOutlinePath ?? undefined} fill="none" stroke={areaSeries.color}
          strokeWidth="1.5" strokeDasharray="2 3" data-series="total-outline" />
      </g>}
      <path
        d={path ?? undefined}
        fill="none"
        stroke={lineColor}
        strokeWidth="2"
        clipPath={`url(#${clipId})`}
        data-series="line"
      />
      {outside.map((point) => (
        <text
          key={`${point.label}-${point.year}`}
          x={x(point.year)}
          y={point.scale(Math.max(point.domain[0], Math.min(point.domain[1], point.value))) + 4}
          textAnchor="middle"
          fill={point.color}
          fontSize="12"
        >
          <title>{`${formatYear(point.year)} ${point.label}: ${formatValue(point.value)}${unit}（表示範囲外）`}</title>
          {point.value < point.domain[0] ? '▼' : '▲'}
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
            fill={lineColor}
            className="stroke-background"
            strokeWidth="2"
          />
        </g>
      )}
      {hovered && <g data-hover-year={hovered.year} pointerEvents="none">
        <line x1={x(hovered.year)} x2={x(hovered.year)} y1={top} y2={height - bottom}
          className="stroke-muted-foreground" strokeDasharray="3 3" />
        <circle cx={x(hovered.year)} cy={pointY(hovered.value)} r="4" fill={lineColor}
          className="stroke-background" strokeWidth="2" />
        {areaSeries && Number.isFinite(areaValues.get(hovered.year)) && <circle
          cx={x(hovered.year)} cy={areaPointY(areaValues.get(hovered.year)!)} r="4"
          fill={areaSeries.color} className="stroke-background" strokeWidth="2" />}
      </g>}
      {active && <rect
        x={plotLeft} y={top} width={width - right - plotLeft} height={height - bottom - top}
        fill="transparent" role="slider" tabIndex={0}
            className="stroke-transparent focus-visible:stroke-ring" strokeWidth="1.5"
        aria-label="年度ごとの値"
        aria-valuemin={validData[0].year} aria-valuemax={validData[validData.length - 1].year}
        aria-valuenow={active.year}
        aria-valuetext={`${formatYear(active.year)}、${itemsFor(active).map((item) => `${item.name}: ${item.value === null ? '欠測' : formatValue(item.value)}${item.unit ?? unit}`).join('、')}`}
        onFocus={(event) => showKeyboardPoint(active, event.currentTarget)}
        onBlur={dismiss} onKeyDown={handleKey}
      />}
      {/* 最初の年は描画域の始点から右へ書く (中央揃えだと最下段の目盛りの文字の下へはみ出していた) */}
      {showAxes && <text
        x={plotLeft}
        y={height - 4}
        textAnchor="start"
        className="fill-muted-foreground"
        fontSize="12"
      >
        {data[0].year}
      </text>}
      {showAxes && <text
        x={width - right}
        y={height - 4}
        textAnchor="end"
        className="fill-muted-foreground"
        fontSize="12"
      >
        {data[data.length - 1].year}
      </text>}
    </svg>
  );
}
