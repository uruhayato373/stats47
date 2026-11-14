import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { TEMPLATE_MIN_FONT_SIZE, LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame, textWidth } from './template-sample-frame';

export interface RadarSeries {
  name: string;
  /** Axis key to a value from 0 to 1. Normalizing and turning an axis around belong to the caller. */
  values: Record<string, number>;
  /** A comparison line such as the median of all prefectures: dashed and unfilled. */
  reference?: boolean;
}
export interface RadarChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  axes: { key: string; label: string }[];
  series: RadarSeries[];
}

const MIN_AXES = 3;
const MAX_SERIES = 3;
const RINGS = [0.25, 0.5, 0.75, 1];
const RADIUS = 300;
const LABEL_GAP = 28;
const LABEL_SIZE = 30;
const LABEL_LINE = 38;
const LABEL_WIDTH = 200;
const LEGEND_SIZE = TEMPLATE_MIN_FONT_SIZE;
const LEGEND_GAP = 40;
const LEGEND_MARK = 58;

/** A label split into lines of even width, so that no line is a single stranded character. */
function labelLines(label: string) {
  const width = textWidth(label, LABEL_SIZE);
  const target = width / Math.ceil(width / LABEL_WIDTH);
  const lines = [''];
  for (const char of label) {
    if (textWidth(lines[lines.length - 1], LABEL_SIZE) >= target) lines.push('');
    lines[lines.length - 1] += char;
  }
  return lines;
}

/**
 * The radar type: one axis per measure, rings without numbers, and at most three filled series over an
 * optional dashed reference. A missing value stops the drawing, since it would read as the smallest value.
 */
export function renderRadarChart(chart: RadarChart, theme: ChartTheme = LIGHT_THEME) {
  const { axes, series } = chart;
  const drawn = series.filter((s) => !s.reference);
  if (axes.length < MIN_AXES) throw Error('レーダーチャートの軸は 3 つ以上必要です。');
  if (drawn.length < 1 || drawn.length > MAX_SERIES) throw Error('レーダーチャートの系列は 1〜3 です。');
  for (const s of series) for (const axis of axes) {
    const value = s.values[axis.key];
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0 || value > 1) throw Error(`レーダーチャートの値が 0〜1 ではありません: ${s.name} ${axis.label}`);
  }
  const legendY = SAMPLE_FRAME.bodyBottom - 24;
  const top = sampleBodyTop(Boolean(chart.note));
  const center = { x: (SAMPLE_FRAME.left + SAMPLE_FRAME.right) / 2, y: (top + legendY) / 2 - 10 };
  const angleOf = (i: number) => (Math.PI * 2 * i) / axes.length - Math.PI / 2;
  const at = (i: number, radius: number) => ({ x: center.x + Math.cos(angleOf(i)) * radius, y: center.y + Math.sin(angleOf(i)) * radius });
  const pointsOf = (radiusOf: (i: number) => number) => axes.map((_, i) => { const p = at(i, radiusOf(i)); return `${p.x.toFixed(1)},${p.y.toFixed(1)}`; }).join(' ');
  const rings = RINGS.map((ring) => `<polygon points="${pointsOf(() => RADIUS * ring)}" fill="none" stroke="${theme.line}" stroke-width="2"/>`).join('');
  const spokes = axes.map((_, i) => { const p = at(i, RADIUS); return `<line x1="${center.x}" y1="${center.y}" x2="${p.x.toFixed(1)}" y2="${p.y.toFixed(1)}" stroke="${theme.line}" stroke-width="2"/>`; }).join('');
  const labels = axes.map((axis, i) => {
    const p = at(i, RADIUS + LABEL_GAP), cos = Math.cos(angleOf(i)), sin = Math.sin(angleOf(i));
    const anchor = Math.abs(cos) < 0.2 ? 'middle' : cos > 0 ? 'start' : 'end';
    const lines = labelLines(axis.label);
    // Above the chart the last line sits on the point, below it the first, and beside it the middle.
    const lift = sin < -0.9 ? 1 : sin > 0.9 ? 0 : 0.5;
    const firstY = p.y + LABEL_SIZE / 3 - (lines.length - 1) * LABEL_LINE * lift;
    return `<text text-anchor="${anchor}" font-size="${LABEL_SIZE}" font-weight="700">${lines.map((line, n) => `<tspan x="${p.x.toFixed(1)}" y="${(firstY + n * LABEL_LINE).toFixed(1)}">${escapeXml(line)}</tspan>`).join('')}</text>`;
  }).join('');
  const colorOf = (s: RadarSeries) => (s.reference ? theme.muted : SERIES_COLORS[drawn.indexOf(s) % SERIES_COLORS.length]);
  // The reference goes first so that the series stay on top of it.
  const shapes = [...series].sort((a, b) => Number(Boolean(b.reference)) - Number(Boolean(a.reference))).map((s) => {
    const points = pointsOf((i) => RADIUS * s.values[axes[i].key]), color = colorOf(s);
    if (s.reference) return `<polygon data-series="${escapeXml(s.name)}" points="${points}" fill="none" stroke="${color}" stroke-width="4" stroke-dasharray="14 10"/>`;
    const dots = axes.map((axis, i) => { const p = at(i, RADIUS * s.values[axis.key]); return `<circle cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="8" fill="${color}"/>`; }).join('');
    return `<polygon data-series="${escapeXml(s.name)}" points="${points}" fill="${color}" fill-opacity="0.2" stroke="${color}" stroke-width="5"/>${dots}`;
  }).join('');
  const widthOf = (s: RadarSeries) => LEGEND_MARK + textWidth(s.name, LEGEND_SIZE);
  let x = center.x - (series.reduce((sum, s) => sum + widthOf(s), 0) + LEGEND_GAP * (series.length - 1)) / 2;
  const legend = series.map((s) => {
    const start = x, color = colorOf(s);
    x += widthOf(s) + LEGEND_GAP;
    const mark = s.reference
      ? `<line x1="${start}" y1="${legendY - 9}" x2="${start + 44}" y2="${legendY - 9}" stroke="${color}" stroke-width="4" stroke-dasharray="12 7"/>`
      : `<rect x="${start + 6}" y="${legendY - 26}" width="34" height="34" rx="4" fill="${color}"/>`;
    return `${mark}<text x="${start + LEGEND_MARK}" y="${legendY}" font-size="${LEGEND_SIZE}">${escapeXml(s.name)}</text>`;
  }).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title, 64), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="radar" data-axes="${axes.length}"`,
    body: rings + spokes + labels + shapes + legend,
    theme,
  });
}
