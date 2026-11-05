import * as d3chromatic from 'd3-scale-chromatic';
import { SERIES_COLORS } from '../../../packages/svg-builder/src/shared/color';
import { BRAND } from '../../web/src/features/ogp/brand';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { rankingRows } from './template-ranking-bars';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_PRESENTATION, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { compositionSampleRows } from './template-composition-stacked';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';

const LIQUOR = { title: '酒類別の販売数量構成比', source: '国税庁「酒のしおり」' } as const;

/** White or ink on a fill, whichever contrasts more (ink luminance is about 0.02). */
function labelOn(color: string) {
  const rgb = color.startsWith('#')
    ? [1, 3, 5].map((i) => parseInt(color.slice(i, i + 2), 16))
    : (color.match(/\d+/g) ?? []).slice(0, 3).map(Number);
  const [r, g, b] = rgb.map((c) => { const v = c / 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; });
  const l = 0.2126 * r + 0.7152 * g + 0.0722 * b;
  return 1.05 / (l + 0.05) > (l + 0.05) / 0.07 ? '#FFFFFF' : BRAND.ink;
}

/** Shares (%) of each category for one fiscal year, in the input's category order. */
function liquorShares(raw: unknown) {
  const rows = compositionSampleRows(raw);
  const categories = [...new Set(rows.map((row) => row.areaName))];
  const years = [...new Set(rows.map((row) => row.yearCode))];
  const share = (category: string, year: string) => {
    const total = rows.filter((row) => row.yearCode === year).reduce((sum, row) => sum + (row.value ?? 0), 0);
    return (rows.find((row) => row.areaName === category && row.yearCode === year)!.value ?? 0) / total * 100;
  };
  return { categories, years, share };
}

/**
 * Distribution of all 47 prefectures: one box (quartiles, median), whiskers to 1.5 × IQR, the
 * prefectures beyond them named, and every value as a dot below. Box in the metric's colour.
 */
export function renderDistributionBoxplot(raw: unknown) {
  const label = rankingSampleLabels();
  const rows = rankingRows(raw);
  const values = rows.map((row) => row.value).sort((a, b) => a - b);
  const quantile = (p: number) => {
    const i = (values.length - 1) * p, lo = Math.floor(i), hi = Math.ceil(i);
    return values[lo] + (values[hi] - values[lo]) * (i - lo);
  };
  const [q1, median, q3] = [0.25, 0.5, 0.75].map(quantile);
  const fence = { lo: q1 - 1.5 * (q3 - q1), hi: q3 + 1.5 * (q3 - q1) };
  const inner = values.filter((v) => v >= fence.lo && v <= fence.hi);
  const whisker = { lo: Math.min(...inner), hi: Math.max(...inner) };
  const color = resolveMetricColor(RANKING_SAMPLE_PRESENTATION) ?? BRAND.primary;
  const top = sampleBodyTop(Boolean(label.subtitle)) + 60;
  const axis = { left: SAMPLE_FRAME.left + 40, right: SAMPLE_FRAME.right - 40 };
  const [min, max] = [values[0], values[values.length - 1]];
  const pad = (max - min) * 0.06;
  const xAt = (v: number) => axis.left + (axis.right - axis.left) * (v - (min - pad)) / (max - min + 2 * pad);
  const box = { y: top + 80, h: 260 };
  const mid = box.y + box.h / 2;
  const stats = [
    { name: '最小', value: min }, { name: '第1四分位', value: q1 }, { name: '中央値', value: median },
    { name: '第3四分位', value: q3 }, { name: '最大', value: max },
  ];
  const outliers = rows.filter((row) => row.value < fence.lo || row.value > fence.hi);
  const outlierMarks = outliers.map((row) => `<g data-outlier="${row.area_code}"><circle cx="${xAt(row.value)}" cy="${mid}" r="12" fill="none" stroke="${color}" stroke-width="4"/><text x="${xAt(row.value)}" y="${box.y - 24}" text-anchor="middle" font-size="32" font-weight="700">${escapeXml(row.area_name)}</text></g>`).join('');
  const dotsTop = box.y + box.h + 110;
  // Dots stack upward where values repeat, so every prefecture stays visible.
  const seen = new Map<string, number>();
  const dots = rows.map((row) => {
    const key = row.value.toFixed(1), n = seen.get(key) ?? 0;
    seen.set(key, n + 1);
    return `<circle data-area="${row.area_code}" cx="${xAt(row.value).toFixed(1)}" cy="${dotsTop + 220 - n * 28}" r="12" fill="${color}" fill-opacity="0.75"/>`;
  }).join('');
  const statRow = stats.map((s, i) => {
    const x = SAMPLE_FRAME.left + i * ((SAMPLE_FRAME.right - SAMPLE_FRAME.left) / stats.length);
    return `<text x="${x}" y="${SAMPLE_FRAME.bodyBottom - 110}" font-size="26" fill="${BRAND.muted}">${s.name}</text><text x="${x}" y="${SAMPLE_FRAME.bodyBottom - 60}" font-size="40" font-weight="700">${label.formatValue(s.value)}</text>`;
  }).join('');
  const body = `
    <line x1="${xAt(whisker.lo)}" y1="${mid}" x2="${xAt(q1)}" y2="${mid}" stroke="${color}" stroke-width="4"/>
    <line x1="${xAt(q3)}" y1="${mid}" x2="${xAt(whisker.hi)}" y2="${mid}" stroke="${color}" stroke-width="4"/>
    <line x1="${xAt(whisker.lo)}" y1="${mid - 40}" x2="${xAt(whisker.lo)}" y2="${mid + 40}" stroke="${color}" stroke-width="4"/>
    <line x1="${xAt(whisker.hi)}" y1="${mid - 40}" x2="${xAt(whisker.hi)}" y2="${mid + 40}" stroke="${color}" stroke-width="4"/>
    <rect data-box="true" x="${xAt(q1)}" y="${box.y}" width="${xAt(q3) - xAt(q1)}" height="${box.h}" rx="8" fill="${color}" fill-opacity="0.18" stroke="${color}" stroke-width="4"/>
    <line x1="${xAt(median)}" y1="${box.y}" x2="${xAt(median)}" y2="${box.y + box.h}" stroke="${color}" stroke-width="8"/>
    ${outlierMarks}
    <text x="${SAMPLE_FRAME.left}" y="${dotsTop - 20}" font-size="28" font-weight="700" fill="${BRAND.muted}">47都道府県の値</text>
    ${dots}
    <line x1="${axis.left}" y1="${dotsTop + 244}" x2="${axis.right}" y2="${dotsTop + 244}" stroke="${BRAND.line}" stroke-width="2"/>
    ${statRow}`;
  return sampleFrame({
    title: `${RANKING_SAMPLE_METRIC.title}の分布`,
    meta: `${RANKING_SAMPLE_YEAR}年 · 単位：${label.unit} · 47都道府県`,
    note: label.subtitle || undefined, source: label.source,
    ariaLabel: `${RANKING_SAMPLE_METRIC.title}・47都道府県の分布`,
    attributes: `data-points="${rows.length}"`,
    body,
  });
}

/** One fiscal year's composition as a donut: the year in the centre, every share in the legend. */
export function renderCompositionPie(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  const { categories, years, share } = liquorShares(raw);
  const year = years[years.length - 1];
  const top = sampleBodyTop(false) + 30;
  const center = { x: 540, y: top + 330 }, radius = { outer: 300, inner: 170 };
  let angle = -Math.PI / 2;
  const point = (r: number, a: number) => `${(center.x + r * Math.cos(a)).toFixed(1)},${(center.y + r * Math.sin(a)).toFixed(1)}`;
  const slices = categories.map((category, i) => {
    const value = share(category, year), sweep = value / 100 * Math.PI * 2, end = angle + sweep;
    const large = sweep > Math.PI ? 1 : 0;
    const d = `M${point(radius.outer, angle)} A${radius.outer},${radius.outer} 0 ${large} 1 ${point(radius.outer, end)} L${point(radius.inner, end)} A${radius.inner},${radius.inner} 0 ${large} 0 ${point(radius.inner, angle)} Z`;
    const fill = SERIES_COLORS[i % SERIES_COLORS.length];
    const mid = angle + sweep / 2, labelR = (radius.outer + radius.inner) / 2;
    const text = value >= 6 ? `<text x="${(center.x + labelR * Math.cos(mid)).toFixed(1)}" y="${(center.y + labelR * Math.sin(mid) + 11).toFixed(1)}" text-anchor="middle" font-size="30" font-weight="700" fill="${labelOn(fill)}">${value.toFixed(1)}%</text>` : '';
    angle = end;
    return `<path data-category="${escapeXml(category)}" d="${d}" fill="${fill}" stroke="${theme.paper}" stroke-width="3"/>${text}`;
  }).join('');
  const legendTop = center.y + radius.outer + 70, column = (SAMPLE_FRAME.right - SAMPLE_FRAME.left) / 2;
  const legend = categories.map((category, i) => {
    const x = SAMPLE_FRAME.left + (i % 2) * column, y = legendTop + Math.floor(i / 2) * 60;
    return `<rect x="${x}" y="${y}" width="32" height="32" rx="4" fill="${SERIES_COLORS[i % SERIES_COLORS.length]}"/><text x="${x + 46}" y="${y + 26}" font-size="${Math.min(26, (column - 46 - 130) / category.length).toFixed(1)}">${escapeXml(category)}</text><text x="${x + column - 24}" y="${y + 26}" text-anchor="end" font-size="26" font-weight="700">${share(category, year).toFixed(1)}%</text>`;
  }).join('');
  return sampleFrame({
    title: LIQUOR.title, titleSize: 64, meta: `${year} · 全国 · 単位：%`, source: LIQUOR.source,
    theme,
    body: `${slices}<text x="${center.x}" y="${center.y + 14}" text-anchor="middle" font-size="40" font-weight="700">${escapeXml(year)}</text>${legend}`,
  });
}

/** Categories × fiscal years, each cell shaded by its share with the value written in it. */
export function renderCompositionHeatmap(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  const { categories, years, share } = liquorShares(raw);
  const values = categories.flatMap((category) => years.map((year) => share(category, year)));
  const maxShare = Math.max(...values);
  const colorAt = (v: number) => d3chromatic.interpolateBlues(0.08 + 0.85 * v / maxShare);
  const top = sampleBodyTop(false) + 30;
  const grid = { left: 420, right: SAMPLE_FRAME.right, header: 64 };
  const cellW = (grid.right - grid.left) / years.length;
  const cellH = (SAMPLE_FRAME.bodyBottom - top - grid.header) / categories.length;
  const header = years.map((year, j) => `<text x="${grid.left + cellW * (j + 0.5)}" y="${top + 42}" text-anchor="middle" font-size="30" font-weight="700" fill="${theme.muted}">${escapeXml(year)}</text>`).join('');
  const cells = categories.map((category, i) => {
    const y = top + grid.header + i * cellH;
    const row = years.map((year, j) => {
      const v = share(category, year), fill = colorAt(v);
      return `<rect x="${grid.left + j * cellW + 3}" y="${y + 3}" width="${cellW - 6}" height="${cellH - 6}" rx="6" fill="${fill}"/><text x="${grid.left + cellW * (j + 0.5)}" y="${y + cellH / 2 + 12}" text-anchor="middle" font-size="34" font-weight="700" fill="${labelOn(fill)}">${v.toFixed(1)}%</text>`;
    }).join('');
    return `<g data-category="${escapeXml(category)}"><text x="${SAMPLE_FRAME.left}" y="${y + cellH / 2 + 10}" font-size="${Math.min(28, (grid.left - SAMPLE_FRAME.left - 20) / category.length).toFixed(1)}">${escapeXml(category)}</text>${row}</g>`;
  }).join('');
  return sampleFrame({
    title: LIQUOR.title, titleSize: 64, meta: `${years[0]}・${years[1]}・${years[2]} · 全国 · 単位：%`, source: LIQUOR.source,
    body: header + cells,
    theme,
  });
}
