import { BRAND } from '../../web/src/features/ogp/brand';
import { rankingRows } from './template-ranking-bars';
import { assertRankingRows, sampleRankingChart, type RankingChart } from './template-ranking-data';
import { SAMPLE_FRAME, escapeXml, fitTitleSize, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';
import { TEMPLATE_MIN_FONT_SIZE, LIGHT_THEME, mixColor, toHex, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';

export const RANKING_TABLE_SAMPLE_ID = 'maximum-temperature-table';
const COLUMN_COUNT = 2;
const COLUMN_GAP = 32;
const HEADER_HEIGHT = 44;
const TEXT_SIZE = TEMPLATE_MIN_FONT_SIZE;
const HEADER_SIZE = TEMPLATE_MIN_FONT_SIZE;
const CELL = { rankRight: 48, name: 64, valueInset: 12 } as const;

/** The sample's fixed input, drawn by the same table every chart uses. */
export function renderRankingTable(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  return renderRankingTableChart(sampleRankingChart({ data: rankingRows(raw) }), theme);
}

/**
 * Every prefecture in two columns read top to bottom, so no row is left out. Ranks take the metric's own
 * colour (as the bars do); bars and axes belong to the bar-chart form.
 */
export function renderRankingTableChart(chart: RankingChart, theme: ChartTheme = LIGHT_THEME) {
  const rows = assertRankingRows(chart.rows);
  const color = toHex(resolveMetricColor(chart.presentation) ?? BRAND.primary);
  const rankColor = theme.name === 'dark' ? mixColor(color, '#FFFFFF', 0.45) : color;
  const top = sampleBodyTop(Boolean(chart.note)) + 8;
  const perColumn = Math.ceil(rows.length / COLUMN_COUNT);
  const rowHeight = (SAMPLE_FRAME.bodyBottom - top - HEADER_HEIGHT) / perColumn;
  const width = (SAMPLE_FRAME.right - SAMPLE_FRAME.left - COLUMN_GAP) / COLUMN_COUNT;
  const column = (index: number) => {
    const left = SAMPLE_FRAME.left + index * (width + COLUMN_GAP), right = left + width - CELL.valueInset;
    const header = `<rect x="${left}" y="${top}" width="${width}" height="${HEADER_HEIGHT}" fill="${theme.wash}"/><g font-size="${HEADER_SIZE}" font-weight="700" fill="${theme.muted}"><text x="${left + CELL.rankRight}" y="${top + 30}" text-anchor="end">順位</text><text x="${left + CELL.name}" y="${top + 30}">都道府県</text><text x="${right}" y="${top + 30}" text-anchor="end">${escapeXml(chart.unit)}</text></g>`;
    const body = rows.slice(index * perColumn, (index + 1) * perColumn).map((row, i) => {
      const y = top + HEADER_HEIGHT + i * rowHeight, baseline = y + rowHeight / 2 + TEXT_SIZE * 0.36;
      const stripe = i % 2 ? `<rect x="${left}" y="${y.toFixed(1)}" width="${width}" height="${rowHeight.toFixed(1)}" fill="${theme.wash}" opacity="0.5"/>` : '';
      return `<g data-rank="${row.rank}" data-value="${row.value}">${stripe}<text x="${left + CELL.rankRight}" y="${baseline.toFixed(1)}" text-anchor="end" font-size="${TEXT_SIZE}" font-weight="700" fill="${rankColor}">${row.rank}</text><text x="${left + CELL.name}" y="${baseline.toFixed(1)}" font-size="${TEXT_SIZE}" font-weight="600">${escapeXml(row.area_name)}</text><text x="${right}" y="${baseline.toFixed(1)}" text-anchor="end" font-size="${TEXT_SIZE}" font-weight="700">${chart.formatValue(row.value)}</text></g>`;
    }).join('');
    return header + body;
  };
  const title = `${chart.title}ランキング`;
  return sampleFrame({
    title, titleSize: fitTitleSize(title), meta: `${chart.yearLabel} · 単位：${chart.unit}`, note: chart.note, source: chart.source,
    attributes: 'data-image-template="table"',
    body: Array.from({ length: COLUMN_COUNT }, (_, index) => column(index)).join(''),
    theme,
  });
}
