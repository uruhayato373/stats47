import { REGIONS } from '../../../packages/area/src/constants/regions';
import { BRAND } from '../../web/src/features/ogp/brand';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { LIGHT_THEME, mixColor, toHex, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { assertRankingRows, type RankingChart } from './template-ranking-data';

/** Inclusive quantile of sorted values, the same rule as the distribution sample. */
function quantile(sorted: number[], p: number) {
  const i = (sorted.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (i - lo);
}

/**
 * Prefectures grouped by region: a box per region on one shared axis, each prefecture a dot, the highest
 * and lowest prefecture of each region named under the row. Regions keep their geographic order.
 */
export function renderRegionalBoxplotChart(chart: RankingChart, theme: ChartTheme = LIGHT_THEME) {
  const rows = assertRankingRows(chart.rows);
  const color = toHex(resolveMetricColor(chart.presentation) ?? BRAND.primary);
  const dark = theme.name === 'dark';
  const ink = dark ? mixColor(color, '#FFFFFF', 0.45) : color;
  const dot = dark ? mixColor(color, '#FFFFFF', 0.45) : color;
  const left = SAMPLE_FRAME.left, right = SAMPLE_FRAME.right;
  const values = rows.map((row) => row.value);
  const [min, max] = [Math.min(...values), Math.max(...values)];
  const pad = (max - min) * 0.04;
  const xAt = (v: number) => left + 24 + (right - left - 48) * (v - (min - pad)) / (max - min + 2 * pad);
  const top = sampleBodyTop(Boolean(chart.note)) + 4;
  const rowHeight = (SAMPLE_FRAME.bodyBottom - top) / REGIONS.length;
  const body = REGIONS.map((region, i) => {
    const members = rows.filter((row) => (region.prefectures as readonly string[]).includes(row.area_code));
    const sorted = members.map((row) => row.value).sort((a, b) => a - b);
    const [q1, median, q3] = [0.25, 0.5, 0.75].map((p) => quantile(sorted, p));
    const high = members.reduce((a, b) => (b.value > a.value ? b : a));
    const low = members.reduce((a, b) => (b.value < a.value ? b : a));
    const y = top + i * rowHeight, boxTop = y + 52, boxHeight = 40, mid = boxTop + boxHeight / 2, labelY = boxTop + boxHeight + 34;
    const wash = i % 2 === 0 ? `<rect x="${left}" y="${y}" width="${right - left}" height="${rowHeight}" fill="${mixColor(color, theme.paper, dark ? 0.86 : 0.94)}"/>` : '';
    const name = (row: typeof high) => row.area_name.replace(/[都府県]$/, '');
    const dots = members.map((row) => `<circle data-area="${row.area_code}" cx="${xAt(row.value).toFixed(1)}" cy="${mid}" r="8" fill="${dot}" stroke="${theme.paper}" stroke-width="2"/>`).join('');
    const ends = high === low ? '' : `<text x="${xAt(low.value)}" y="${labelY}" font-size="26" text-anchor="${xAt(low.value) < left + 90 ? 'start' : 'middle'}" fill="${theme.muted}">${escapeXml(name(low))}</text>
      <text x="${xAt(high.value)}" y="${labelY}" font-size="26" text-anchor="${xAt(high.value) > right - 90 ? 'end' : 'middle'}" fill="${theme.muted}">${escapeXml(name(high))}</text>`;
    return `<g data-region="${escapeXml(region.regionName)}" data-median="${median}">${wash}
      <text x="${left + 20}" y="${y + 38}" font-size="30" font-weight="700">${escapeXml(region.regionName)}</text>
      <text x="${right - 20}" y="${y + 38}" text-anchor="end" font-size="30" font-weight="700" fill="${ink}">中央値 ${escapeXml(chart.formatValue(median))}</text>
      <line x1="${xAt(sorted[0])}" y1="${mid}" x2="${xAt(sorted[sorted.length - 1])}" y2="${mid}" stroke="${ink}" stroke-width="3"/>
      <rect x="${xAt(q1)}" y="${boxTop}" width="${Math.max(xAt(q3) - xAt(q1), 4)}" height="${boxHeight}" rx="6" fill="${color}" fill-opacity="${dark ? 0.45 : 0.22}" stroke="${ink}" stroke-width="3"/>
      <line x1="${xAt(median)}" y1="${boxTop}" x2="${xAt(median)}" y2="${boxTop + boxHeight}" stroke="${ink}" stroke-width="6"/>
      ${dots}${ends}</g>`;
  }).join('');
  return sampleFrame({
    title: `${chart.title}の地域差`,
    meta: `${chart.yearLabel} · 単位：${chart.unit} · 範囲：${chart.formatValue(min)}–${chart.formatValue(max)}`,
    note: chart.note,
    source: chart.source,
    ariaLabel: `${chart.title}・地方ごとの分布`,
    attributes: `data-image-template="boxplot" data-points="${rows.length}"`,
    body,
    theme,
  });
}
