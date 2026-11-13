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
const VALUE_SIZE = 28;
// A value smaller than this cannot be read at phone width: bars thinner than it keep the tick axis instead.
const VALUE_MIN_SIZE = 22;
const VALUE_GAP = 8;
// A value keeps this much clear of its neighbours' bars on both sides together.
const VALUE_SIDE_ROOM = 4;
// The height of a digit as a share of the font size.
const DIGIT_HEIGHT = 0.72;

/**
 * How a value sits on its bar: level when the longest value fits the bar's width, turned upward when only
 * its line height fits, and not at all when the bar is thinner than the smallest readable size.
 */
function valueLabelPlan(barWidth: number, longest: string) {
  const level = Math.min(VALUE_SIZE, Math.floor((barWidth - VALUE_SIDE_ROOM) * VALUE_SIZE / textWidth(longest, VALUE_SIZE)));
  if (level >= VALUE_MIN_SIZE) return { size: level, turned: false, room: level + VALUE_GAP };
  const turned = Math.min(VALUE_SIZE, Math.floor(barWidth));
  if (turned >= VALUE_MIN_SIZE) return { size: turned, turned: true, room: textWidth(longest, turned) + VALUE_GAP };
  return null;
}

/**
 * For categories that are not a timeline, such as the twelve months of a year's cycle. A line would read
 * as a trend across them. The value axis starts at zero, each bar carries its value, and one legend sits
 * above the plot. Ticks and grid lines are drawn only when the bars are too thin to carry a value
 * (chart-image-copy.md: values go on the bars, ticks are off by default).
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
  const decimals = Math.min(2, Math.max(0, ...values.map((v) => (String(v).split('.')[1] ?? '').length)));
  const format = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  const slotWidth = (left: number) => ((SAMPLE_FRAME.right - left) / groups.length - GROUP_GAP) / series.length;
  const longest = values.map(format).reduce((a, b) => (textWidth(b, VALUE_SIZE) > textWidth(a, VALUE_SIZE) ? b : a));
  const label = valueLabelPlan(slotWidth(SAMPLE_FRAME.left), longest);
  const extent = [Math.min(0, ...values), Math.max(0, ...values)];
  const y = label
    ? scaleLinear().domain(extent).range([bottom - (extent[0] < 0 ? label.room : 0), top + (extent[1] > 0 ? label.room : 0)])
    : scaleLinear().domain(extent).nice().range([bottom, top]);
  const ticks = label ? [] : y.ticks(5);
  const left = SAMPLE_FRAME.left + (label ? 0 : Math.max(...ticks.map((t) => textWidth(t.toLocaleString('en-US'), TICK_SIZE))) + 20);
  const groupWidth = (SAMPLE_FRAME.right - left) / groups.length;
  const barWidth = slotWidth(left);
  if (barWidth < MIN_BAR_WIDTH) throw Error(`棒が細すぎます (${groups.length} 区分 × ${series.length} 系列)。系列を減らしてください。`);
  const grid = label
    ? `<line x1="${left}" y1="${y(0).toFixed(1)}" x2="${SAMPLE_FRAME.right}" y2="${y(0).toFixed(1)}" stroke="${theme.line}" stroke-width="2.5"/>`
    : ticks.map((tick) => `<line x1="${left}" y1="${y(tick)}" x2="${SAMPLE_FRAME.right}" y2="${y(tick)}" stroke="${theme.line}" stroke-width="${tick === 0 ? 2.5 : 1.5}"/><text x="${left - 16}" y="${y(tick) + 10}" text-anchor="end" font-size="${TICK_SIZE}" fill="${theme.muted}">${tick.toLocaleString('en-US')}</text>`).join('');
  const valueLabel = (value: number, centerX: number, end: number) => {
    if (!label) return '';
    const up = value >= 0;
    if (!label.turned) return `<text data-label="value" x="${centerX.toFixed(1)}" y="${(up ? end - VALUE_GAP : end + VALUE_GAP + label.size * DIGIT_HEIGHT).toFixed(1)}" text-anchor="middle" font-size="${label.size}" fill="${theme.ink}">${format(value)}</text>`;
    // Turned text runs upward from its anchor: it starts above a rising bar and ends below a falling one.
    const [x, anchorY] = [(centerX + label.size * DIGIT_HEIGHT / 2).toFixed(1), (up ? end - VALUE_GAP : end + VALUE_GAP).toFixed(1)];
    return `<text data-label="value" x="${x}" y="${anchorY}" text-anchor="${up ? 'start' : 'end'}" transform="rotate(-90 ${x} ${anchorY})" font-size="${label.size}" fill="${theme.ink}">${format(value)}</text>`;
  };
  const bars = groups.map((group, g) => {
    const x0 = left + g * groupWidth + GROUP_GAP / 2;
    const rects = series.map((s, i) => {
      const value = s.values[g];
      if (value === null) return '';
      const start = y(0), end = y(value);
      const x = x0 + i * barWidth;
      return `<rect data-value="${value}" x="${x.toFixed(1)}" y="${Math.min(start, end).toFixed(1)}" width="${(barWidth - 1).toFixed(1)}" height="${Math.abs(start - end).toFixed(1)}" fill="${SERIES_COLORS[i % SERIES_COLORS.length]}"/>${valueLabel(value, x + (barWidth - 1) / 2, end)}`;
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
