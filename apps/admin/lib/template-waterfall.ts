import { REGIONS } from '../../../packages/area/src/constants/regions';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import type { MigrationPair } from './template-chord';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

export interface WaterfallChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  /** Where the running total starts. Omit for a breakdown that starts from zero. */
  start?: { label: string; value: number };
  /** The changes, in the order they are added. */
  steps: { label: string; value: number }[];
  totalLabel: string;
  /** The published total, when there is one: a mismatch with the sum stops the drawing. */
  total?: number;
}

const INCREASE = SERIES_COLORS[0];
const DECREASE = SERIES_COLORS[1];
const NAME_SIZE = 30;
const VALUE_SIZE = 30;
const ROW_MAX = 124;
const BAR_RATIO = 0.62;
const VALUE_WIDTH = 150;
const VALUE_GAP = 12;

const formatted = (value: number) => value.toLocaleString('en-US');
const signed = (value: number) => `${value > 0 ? '+' : value < 0 ? '−' : ''}${formatted(Math.abs(value))}`;

/**
 * The waterfall type: one row per change, each bar starting where the last one ended, and a last row for
 * the total. The rows run down the page so that Japanese names stay readable on a phone.
 */
export function renderWaterfallChart(chart: WaterfallChart, theme: ChartTheme = LIGHT_THEME) {
  const { start, steps } = chart;
  if (steps.length === 0) throw Error('ウォーターフォールの項目がありません。');
  const startValue = start?.value ?? 0;
  const running = steps.reduce<number[]>((ends, step) => [...ends, (ends[ends.length - 1] ?? startValue) + step.value], []);
  const total = running[running.length - 1];
  if (chart.total !== undefined && chart.total !== total) throw Error(`ウォーターフォールの合計が合いません: ${total} / ${chart.total}`);
  const ends = [0, startValue, ...running];
  const [lowest, highest] = [Math.min(...ends), Math.max(...ends)];
  if (lowest === highest) throw Error('ウォーターフォールの増減がありません。');
  const top = sampleBodyTop(Boolean(chart.note)) + 30;
  const offset = start ? 1 : 0;
  const rowCount = steps.length + 1 + offset;
  const row = Math.min(ROW_MAX, (SAMPLE_FRAME.bodyBottom - top) / rowCount);
  const names = [start?.label ?? '', chart.totalLabel, ...steps.map((step) => step.label)];
  const nameWidth = Math.max(...names.map((name) => textWidth(name, NAME_SIZE)));
  // Room for a value on either side of any bar, so a label never leaves the frame.
  const axis = { left: SAMPLE_FRAME.left + nameWidth + VALUE_WIDTH, right: SAMPLE_FRAME.right - VALUE_WIDTH };
  const xAt = (value: number) => axis.left + (axis.right - axis.left) * (value - lowest) / (highest - lowest);
  const height = row * BAR_RATIO;
  const yOf = (i: number) => top + i * row + (row - height) / 2;
  const rowOf = (i: number, name: string, from: number, to: number, fill: string, label: string, kind: string) => {
    const [a, b] = [xAt(Math.min(from, to)), xAt(Math.max(from, to))];
    const baseline = (yOf(i) + height / 2 + VALUE_SIZE / 3).toFixed(1);
    const value = to >= from
      ? `<text x="${(b + VALUE_GAP).toFixed(1)}" y="${baseline}" font-size="${VALUE_SIZE}" font-weight="700">${label}</text>`
      : `<text x="${(a - VALUE_GAP).toFixed(1)}" y="${baseline}" text-anchor="end" font-size="${VALUE_SIZE}" font-weight="700">${label}</text>`;
    return `<g data-step="${kind}" data-value="${to - from}"><text x="${SAMPLE_FRAME.left}" y="${baseline}" font-size="${NAME_SIZE}" font-weight="${kind === 'step' ? 400 : 700}">${escapeXml(name)}</text><rect x="${a.toFixed(1)}" y="${yOf(i).toFixed(1)}" width="${Math.max(2, b - a).toFixed(1)}" height="${height.toFixed(1)}" fill="${fill}"/>${value}</g>`;
  };
  const rows = [
    ...(start ? [rowOf(0, start.label, 0, start.value, theme.muted, formatted(start.value), 'start')] : []),
    ...steps.map((step, i) => rowOf(i + offset, step.label, i === 0 ? startValue : running[i - 1], running[i], step.value >= 0 ? INCREASE : DECREASE, signed(step.value), 'step')),
    rowOf(steps.length + offset, chart.totalLabel, 0, total, theme.muted, start ? formatted(total) : signed(total), 'total'),
  ].join('');
  // A thin line carries each running total to the next row.
  const connectors = running.map((value, i) => `<line x1="${xAt(value).toFixed(1)}" y1="${(yOf(i + offset) + height).toFixed(1)}" x2="${xAt(value).toFixed(1)}" y2="${yOf(i + offset + 1).toFixed(1)}" stroke="${theme.muted}" stroke-width="2"/>`).join('');
  const zero = `<line x1="${xAt(0).toFixed(1)}" y1="${top}" x2="${xAt(0).toFixed(1)}" y2="${(top + row * rowCount).toFixed(1)}" stroke="${theme.line}" stroke-width="2"/>`;
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title, 64), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="waterfall" data-total="${total}"`,
    body: zero + connectors + rows,
    theme,
  });
}

/** A prefecture's net moves against each region, largest gain first; moves inside itself are not moves. */
export function regionNetSteps(pairs: MigrationPair[], prefCode: string) {
  const regionOf = (code: string) => REGIONS.findIndex((region) => region.prefectures.includes(code));
  const net = REGIONS.map(() => 0);
  for (const { fromPrefCode: from, toPrefCode: to, inflow } of pairs) {
    if (from === to) continue;
    if (to === prefCode) net[regionOf(from)] += inflow;
    if (from === prefCode) net[regionOf(to)] -= inflow;
  }
  return REGIONS.map((region, i) => ({ label: region.regionName, value: net[i] })).sort((a, b) => b.value - a.value);
}
