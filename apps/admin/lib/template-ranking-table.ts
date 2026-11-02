import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { BRAND } from '../../web/src/features/ogp/brand';
import { rankingRows } from './template-ranking-bars';
import { SAMPLE_FRAME, escapeXml, sampleBodyTop, sampleFrame } from './template-sample-frame';
import { resolveMetricColor } from '../../remotion/src/features/data-cards/tile-scale';

export const RANKING_TABLE_SAMPLE_ID = 'maximum-temperature-table';
const ROWS = 10;
const HEADER_HEIGHT = 72;
const COLUMN = { rank: 136, name: 192, valueRight: SAMPLE_FRAME.right - 32 } as const;

/**
 * Read values in aligned columns at frame size: the top ten fill the body down to the source line.
 * Ranks take the metric's own colour (as the bars do); bars and axes belong to the bar-chart form.
 */
export function renderRankingTable(raw: unknown) {
  const label = rankingSampleLabels();
  const rows = rankingRows(raw).slice(0, ROWS);
  const color = resolveMetricColor(RANKING_SAMPLE_METRIC.visualization) ?? BRAND.primary;
  const top = sampleBodyTop(Boolean(label.subtitle)) + 24;
  const width = SAMPLE_FRAME.right - SAMPLE_FRAME.left;
  const rowHeight = (SAMPLE_FRAME.bodyBottom - top - HEADER_HEIGHT) / ROWS;
  const header = `<rect x="${SAMPLE_FRAME.left}" y="${top}" width="${width}" height="${HEADER_HEIGHT}" fill="${BRAND.wash}"/>
    <g font-size="30" font-weight="700" fill="${BRAND.muted}">
      <text x="${COLUMN.rank}" y="${top + 47}" text-anchor="middle">順位</text>
      <text x="${COLUMN.name}" y="${top + 47}">都道府県</text>
      <text x="${COLUMN.valueRight}" y="${top + 47}" text-anchor="end">${escapeXml(`${label.title.replace(/ランキング$/, '')}（${label.unit}）`)}</text>
    </g>`;
  const body = rows.map((row, i) => {
    const y = top + HEADER_HEIGHT + i * rowHeight;
    const baseline = y + rowHeight / 2 + 15;
    return `<g data-rank="${row.rank}" data-value="${row.value}">${i % 2 ? `<rect x="${SAMPLE_FRAME.left}" y="${y}" width="${width}" height="${rowHeight}" fill="${BRAND.wash}" opacity="0.5"/>` : ''}<text x="${COLUMN.rank}" y="${baseline}" text-anchor="middle" font-size="44" font-weight="700" fill="${color}">${row.rank}</text><text x="${COLUMN.name}" y="${baseline}" font-size="44" font-weight="600">${escapeXml(row.area_name)}</text><text x="${COLUMN.valueRight}" y="${baseline}" text-anchor="end" font-size="44" font-weight="700">${label.formatValue(row.value)}</text></g>`;
  }).join('');
  return sampleFrame({
    title: label.title, meta: `${RANKING_SAMPLE_YEAR}年 · 上位10県`, note: label.subtitle || undefined, source: label.source,
    body: header + body,
  });
}
