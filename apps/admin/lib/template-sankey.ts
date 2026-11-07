import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame } from './template-sample-frame';

export interface SankeyFlow { from: string; to: string; value: number }
export interface SankeyChart {
  title: string;
  meta: string;
  note?: string;
  source: string;
  /** The left and right columns, top to bottom. Every flow joins one name from each. */
  sources: string[];
  targets: string[];
  flows: SankeyFlow[];
}

const NODE_WIDTH = 24;
const NODE_GAP = 12;
const LABEL_SIZE = 28;
const LABEL_MIN_STEP = 36;
const SOURCE_NODE_X = 326;
const TARGET_NODE_X = 730;
const LABEL_GAP = 14;

const sumOf = (flows: SankeyFlow[]) => flows.reduce((sum, flow) => sum + flow.value, 0);
const formatted = (value: number) => value.toLocaleString('en-US');

/** Label centres pushed apart only as far as they need, staying inside the column. */
function spreadLabels(centres: number[], top: number, bottom: number) {
  const placed = [...centres];
  placed.forEach((_, i) => { if (i > 0) placed[i] = Math.max(placed[i], placed[i - 1] + LABEL_MIN_STEP); });
  placed[placed.length - 1] = Math.min(placed[placed.length - 1], bottom);
  for (let i = placed.length - 2; i >= 0; i--) placed[i] = Math.min(placed[i], placed[i + 1] - LABEL_MIN_STEP);
  return placed.map((y) => Math.max(y, top));
}

/**
 * The sankey type: two columns of the same total, and one band per pair whose thickness is its amount.
 * Bands take the colour of the right column, so the colours name the categories the flow ends in. Totals are
 * derived from the flows, which keeps both columns equal; a name outside the columns stops the drawing.
 */
export function renderSankeyChart(chart: SankeyChart, theme: ChartTheme = LIGHT_THEME) {
  const { sources, targets } = chart;
  const flows = chart.flows.filter((flow) => flow.value !== 0);
  for (const flow of flows) {
    if (!sources.includes(flow.from) || !targets.includes(flow.to)) throw Error(`サンキーの項目が列にありません: ${flow.from} → ${flow.to}`);
    if (!Number.isFinite(flow.value) || flow.value < 0) throw Error(`サンキーの量が正の数ではありません: ${flow.from} → ${flow.to}`);
  }
  const total = sumOf(flows);
  if (!(total > 0)) throw Error('サンキーの合計が 0 です。');
  const top = sampleBodyTop(Boolean(chart.note)) + 20;
  const bottom = SAMPLE_FRAME.bodyBottom;
  const unit = (bottom - top - NODE_GAP * (Math.max(sources.length, targets.length) - 1)) / total;
  const column = (names: string[], key: 'from' | 'to') => {
    const gap = (bottom - top - total * unit) / Math.max(1, names.length - 1);
    let y = top;
    return names.map((name) => {
      const value = sumOf(flows.filter((flow) => flow[key] === name));
      const node = { name, y, height: value * unit, total: value };
      y += node.height + gap;
      return node;
    });
  };
  const left = column(sources, 'from'), right = column(targets, 'to');
  const colorOf = (name: string) => SERIES_COLORS[targets.indexOf(name) % SERIES_COLORS.length];
  // Bands leave and arrive in the order of the opposite column, which keeps crossings down.
  const leftOffset = new Map(left.map((node) => [node.name, node.y]));
  const rightOffset = new Map(right.map((node) => [node.name, node.y]));
  const ordered = [...flows].sort((a, b) => sources.indexOf(a.from) - sources.indexOf(b.from) || targets.indexOf(a.to) - targets.indexOf(b.to));
  const x0 = SOURCE_NODE_X + NODE_WIDTH, x1 = TARGET_NODE_X, middle = (x0 + x1) / 2;
  const bands = ordered.map((flow) => {
    const thickness = flow.value * unit;
    const y0 = leftOffset.get(flow.from)! + thickness / 2, y1 = rightOffset.get(flow.to)! + thickness / 2;
    leftOffset.set(flow.from, leftOffset.get(flow.from)! + thickness);
    rightOffset.set(flow.to, rightOffset.get(flow.to)! + thickness);
    return `<path data-from="${escapeXml(flow.from)}" data-to="${escapeXml(flow.to)}" data-value="${flow.value}" d="M${x0},${y0.toFixed(1)} C${middle},${y0.toFixed(1)} ${middle},${y1.toFixed(1)} ${x1},${y1.toFixed(1)}" fill="none" stroke="${colorOf(flow.to)}" stroke-opacity="0.5" stroke-width="${thickness.toFixed(2)}"/>`;
  }).join('');
  const bounds = { top: top + LABEL_SIZE / 2, bottom: bottom - LABEL_SIZE / 2 };
  const leftY = spreadLabels(left.map((node) => node.y + node.height / 2), bounds.top, bounds.bottom);
  const rightY = spreadLabels(right.map((node) => node.y + node.height / 2), bounds.top, bounds.bottom);
  const baseline = (y: number) => (y + LABEL_SIZE / 3).toFixed(1);
  const leftNodes = left.map((node, i) => `<g data-source="${escapeXml(node.name)}" data-total="${node.total}"><rect x="${SOURCE_NODE_X}" y="${node.y.toFixed(1)}" width="${NODE_WIDTH}" height="${node.height.toFixed(1)}" fill="${theme.muted}"/><text x="${SAMPLE_FRAME.left}" y="${baseline(leftY[i])}" font-size="${LABEL_SIZE}" font-weight="700">${escapeXml(node.name)}</text><text x="${SOURCE_NODE_X - LABEL_GAP}" y="${baseline(leftY[i])}" text-anchor="end" font-size="${LABEL_SIZE}">${formatted(node.total)}</text></g>`).join('');
  const rightNodes = right.map((node, i) => `<g data-target="${escapeXml(node.name)}" data-total="${node.total}"><rect x="${TARGET_NODE_X}" y="${node.y.toFixed(1)}" width="${NODE_WIDTH}" height="${node.height.toFixed(1)}" fill="${colorOf(node.name)}"/><text x="${TARGET_NODE_X + NODE_WIDTH + LABEL_GAP}" y="${baseline(rightY[i])}" font-size="${LABEL_SIZE}" font-weight="700">${escapeXml(node.name)}</text><text x="${SAMPLE_FRAME.right}" y="${baseline(rightY[i])}" text-anchor="end" font-size="${LABEL_SIZE}">${formatted(node.total)}</text></g>`).join('');
  return sampleFrame({
    title: chart.title, titleSize: fitTitleSize(chart.title, 64), meta: chart.meta, note: chart.note, source: chart.source,
    attributes: `data-image-template="sankey" data-total="${total}"`,
    body: bands + leftNodes + rightNodes,
    theme,
  });
}

interface FlowTable { flowTotals: Record<string, number>; series: { label: string; data: { year: string; value: number | null }[] }[] }

/** Flows from an article's group × category table, stopping when a group's flows miss the total it declares. */
export function flowsFromTable(table: FlowTable) {
  const flows = table.series.flatMap((category) => category.data.flatMap((cell) => (cell.value === null ? [] : [{ from: cell.year, to: category.label, value: cell.value }])));
  const sources = Object.keys(table.flowTotals);
  for (const name of sources) {
    const summed = sumOf(flows.filter((flow) => flow.from === name));
    if (summed !== table.flowTotals[name]) throw Error(`流れの合計が合いません: ${name} ${summed} / ${table.flowTotals[name]}`);
  }
  return { sources, targets: table.series.map((category) => category.label), flows };
}
