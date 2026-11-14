import { niceTicks } from '../../../packages/types/src/numeric-ticks';
import { BRAND } from '../../web/src/features/ogp/brand';
import { TEMPLATE_MIN_FONT_SIZE, LIGHT_THEME, mixColor, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

/** One group's spread, already computed by the analysis: the whiskers end at min and max as given. */
export interface BoxplotGroup { label: string; min: number; q1: number; median: number; q3: number; max: number }
export interface GroupBoxplotChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  /** Rows top to bottom, in the order the analysis gives them. */
  groups: BoxplotGroup[];
  decimals: number;
}

const MAX_GROUPS = 8;
const NAME_SIZE = 30;
const TICK_SIZE = TEMPLATE_MIN_FONT_SIZE;
const BOX_HEIGHT = 56;
const ROW_MAX_HEIGHT = 180;
/** The band at the top of a row that holds the group's name and median. */
const NAME_BAND = 56;

/**
 * Groups compared by their spread on one shared axis: a box from the first to the third quartile, a thick
 * median line with its value at the row's right, and whiskers to the given ends. No dots: the analysis may
 * hold a thousand towns per group, and the summary is what the figure claims.
 */
export function renderGroupBoxplotChart(chart: GroupBoxplotChart, theme: ChartTheme = LIGHT_THEME) {
  const { groups } = chart;
  if (!groups.length || groups.length > MAX_GROUPS) throw Error(`箱ひげの区分は 1〜${MAX_GROUPS} 個にしてください。`);
  for (const g of groups) {
    const ordered = [g.min, g.q1, g.median, g.q3, g.max];
    if (ordered.some((v) => !Number.isFinite(v)) || ordered.some((v, i) => i > 0 && v < ordered[i - 1]))
      throw Error(`${g.label} の箱ひげの値が min ≤ q1 ≤ median ≤ q3 ≤ max になっていません。`);
  }
  const dark = theme.name === 'dark';
  const color = dark ? mixColor(BRAND.primary, '#FFFFFF', 0.45) : BRAND.primary;
  const format = (v: number) => v.toLocaleString('en-US', { minimumFractionDigits: chart.decimals, maximumFractionDigits: chart.decimals });
  const lo = Math.min(...groups.map((g) => g.min)), hi = Math.max(...groups.map((g) => g.max));
  const ticks = niceTicks(lo, hi, 5);
  const domain: [number, number] = ticks.length ? [Math.min(lo, ticks[0]), Math.max(hi, ticks[ticks.length - 1])] : [lo - 1, hi + 1];
  const top = sampleBodyTop(Boolean(chart.note)) + 40;
  // Rows keep a readable height and the axis sits right under the last row, not at the frame's foot.
  const rowHeight = Math.min(ROW_MAX_HEIGHT, (SAMPLE_FRAME.bodyBottom - 90 - top) / groups.length);
  const axisY = top + groups.length * rowHeight + 70;
  const plot = { left: SAMPLE_FRAME.left + 20, right: SAMPLE_FRAME.right - 20 };
  const xAt = (v: number) => plot.left + (plot.right - plot.left) * (v - domain[0]) / (domain[1] - domain[0]);
  const rows = groups.map((g, i) => {
    const y = top + i * rowHeight, boxTop = y + NAME_BAND + (rowHeight - NAME_BAND - BOX_HEIGHT) / 2, mid = boxTop + BOX_HEIGHT / 2;
    const wash = i % 2 === 0 ? `<rect x="${SAMPLE_FRAME.left}" y="${y}" width="${SAMPLE_FRAME.right - SAMPLE_FRAME.left}" height="${rowHeight}" fill="${mixColor(BRAND.primary, theme.paper, dark ? 0.86 : 0.94)}"/>` : '';
    const nameSize = Math.max(TEMPLATE_MIN_FONT_SIZE, Math.min(NAME_SIZE, Math.floor(NAME_SIZE * (SAMPLE_FRAME.right - SAMPLE_FRAME.left - 220) / textWidth(g.label, NAME_SIZE))));
    return `<g data-group="${escapeXml(g.label)}" data-median="${g.median}">${wash}
      <text x="${SAMPLE_FRAME.left + 20}" y="${y + 42}" font-size="${nameSize}" font-weight="700">${escapeXml(g.label)}</text>
      <text x="${SAMPLE_FRAME.right - 20}" y="${y + 42}" text-anchor="end" font-size="${NAME_SIZE}" font-weight="700" fill="${color}">中央値 ${format(g.median)}</text>
      <line x1="${xAt(g.min).toFixed(1)}" y1="${mid}" x2="${xAt(g.max).toFixed(1)}" y2="${mid}" stroke="${color}" stroke-width="3"/>
      <line x1="${xAt(g.min).toFixed(1)}" y1="${mid - 16}" x2="${xAt(g.min).toFixed(1)}" y2="${mid + 16}" stroke="${color}" stroke-width="3"/>
      <line x1="${xAt(g.max).toFixed(1)}" y1="${mid - 16}" x2="${xAt(g.max).toFixed(1)}" y2="${mid + 16}" stroke="${color}" stroke-width="3"/>
      <rect x="${xAt(g.q1).toFixed(1)}" y="${boxTop}" width="${Math.max(xAt(g.q3) - xAt(g.q1), 4).toFixed(1)}" height="${BOX_HEIGHT}" rx="6" fill="${color}" fill-opacity="${dark ? 0.45 : 0.22}" stroke="${color}" stroke-width="3"/>
      <line x1="${xAt(g.median).toFixed(1)}" y1="${boxTop}" x2="${xAt(g.median).toFixed(1)}" y2="${boxTop + BOX_HEIGHT}" stroke="${color}" stroke-width="7"/></g>`;
  }).join('');
  const tickDecimals = Math.min(2, Math.max(0, ...ticks.map((t) => (String(t).split('.')[1] ?? '').length)));
  const axis = `<line x1="${plot.left}" y1="${axisY - 34}" x2="${plot.right}" y2="${axisY - 34}" stroke="${theme.line}" stroke-width="2"/>` +
    ticks.map((t) => `<text x="${xAt(t).toFixed(1)}" y="${axisY}" text-anchor="middle" font-size="${TICK_SIZE}" fill="${theme.muted}">${t.toLocaleString('en-US', { minimumFractionDigits: tickDecimals, maximumFractionDigits: tickDecimals })}</text>`).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="boxplot" data-groups="${groups.length}"`,
    body: rows + axis,
    theme,
  });
}
