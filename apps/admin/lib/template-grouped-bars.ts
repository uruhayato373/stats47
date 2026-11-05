import { scaleLinear } from 'd3-scale';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

/** Bars side by side: one group per category (a month, a prefecture), one bar per series in each. */
export interface GroupedBarChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  groups: string[];
  series: { label: string; values: (number | null)[] }[];
}

// Bars thinner than this cannot be told apart at phone width: split the chart or drop series instead.
const MIN_BAR_WIDTH = 6;
const GROUP_GAP = 10;
const AXIS_LABEL_SIZE = 26;
const TICK_SIZE = 28;
const SWATCH = 26;

/**
 * For categories that are not a timeline, such as the twelve months of a year's cycle. A line would read
 * as a trend across them. The value axis starts at zero, and one legend sits above the plot.
 */
export function renderGroupedBarsChart(chart: GroupedBarChart, theme: ChartTheme = LIGHT_THEME) {
  const { groups, series } = chart;
  const values = series.flatMap((s) => s.values.flatMap((v) => (v === null ? [] : [v])));
  if (!values.length || series.some((s) => s.values.length !== groups.length)) throw Error('棒の値と区分の数を確認してください。');
  const legendY = sampleBodyTop(Boolean(chart.note)) + 26;
  let legendX: number = SAMPLE_FRAME.left;
  const legend = series.map((s, i) => {
    const item = `<rect x="${legendX}" y="${legendY - 22}" width="${SWATCH}" height="${SWATCH}" rx="4" fill="${SERIES_COLORS[i % SERIES_COLORS.length]}"/><text x="${legendX + 38}" y="${legendY}" font-size="30" fill="${theme.ink}">${escapeXml(s.label)}</text>`;
    legendX += 38 + textWidth(s.label, 30) + 36;
    return item;
  }).join('');
  const top = legendY + 40, bottom = SAMPLE_FRAME.bodyBottom - 56;
  const y = scaleLinear().domain([Math.min(0, ...values), Math.max(0, ...values)]).nice().range([bottom, top]);
  const ticks = y.ticks(5);
  const left = SAMPLE_FRAME.left + Math.max(...ticks.map((t) => textWidth(t.toLocaleString('en-US'), TICK_SIZE))) + 20;
  const groupWidth = (SAMPLE_FRAME.right - left) / groups.length;
  const barWidth = (groupWidth - GROUP_GAP) / series.length;
  if (barWidth < MIN_BAR_WIDTH) throw Error(`棒が細すぎます (${groups.length} 区分 × ${series.length} 系列)。系列を減らしてください。`);
  const grid = ticks.map((tick) => `<line x1="${left}" y1="${y(tick)}" x2="${SAMPLE_FRAME.right}" y2="${y(tick)}" stroke="${theme.line}" stroke-width="${tick === 0 ? 2.5 : 1.5}"/><text x="${left - 16}" y="${y(tick) + 10}" text-anchor="end" font-size="${TICK_SIZE}" fill="${theme.muted}">${tick.toLocaleString('en-US')}</text>`).join('');
  const bars = groups.map((group, g) => {
    const x0 = left + g * groupWidth + GROUP_GAP / 2;
    const rects = series.map((s, i) => {
      const value = s.values[g];
      if (value === null) return '';
      const start = y(0), end = y(value);
      return `<rect data-value="${value}" x="${(x0 + i * barWidth).toFixed(1)}" y="${Math.min(start, end).toFixed(1)}" width="${(barWidth - 1).toFixed(1)}" height="${Math.abs(start - end).toFixed(1)}" fill="${SERIES_COLORS[i % SERIES_COLORS.length]}"/>`;
    }).join('');
    return `<g data-group="${escapeXml(group)}">${rects}<text x="${(x0 + (groupWidth - GROUP_GAP) / 2).toFixed(1)}" y="${bottom + 44}" text-anchor="middle" font-size="${AXIS_LABEL_SIZE}" fill="${theme.muted}">${escapeXml(group.replace(/月$/, ''))}</text></g>`;
  }).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: 'data-image-template="grouped-bar"',
    body: legend + grid + bars,
    theme,
  });
}
