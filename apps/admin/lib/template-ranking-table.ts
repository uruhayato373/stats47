import { generateRankingTableSvg } from '../../../packages/svg-builder/src/tables/ranking-table';
import { RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { BRAND } from '../../web/src/features/ogp/brand';
import { rankingRows } from './template-ranking-bars';
import { SAMPLE_FRAME, sampleBodyTop, sampleFrame } from './template-sample-frame';

export const RANKING_TABLE_SAMPLE_ID = 'maximum-temperature-table';

/** Read values in aligned columns; bars and axes belong to the bar-chart form. */
export function renderRankingTable(raw: unknown) {
  const label = rankingSampleLabels();
  const rows = rankingRows(raw).slice(0, 10);
  const table = generateRankingTableSvg(rows.map(row => ({
    rank: row.rank, name: row.area_name, value: row.value,
  })), {
    width: 340,
    rankColor: BRAND.primary,
    valueHeader: `${label.title.replace(/ランキング$/, '')}（${label.unit}）`,
    formatValue: value => label.formatValue(Number(value)),
  });
  // The table keeps its own 340-unit layout; scale it to the frame width.
  const top = sampleBodyTop(Boolean(label.subtitle)) + 24;
  const width = SAMPLE_FRAME.right - SAMPLE_FRAME.left, height = width * 284 / 340;
  return sampleFrame({
    title: label.title, meta: `${RANKING_SAMPLE_YEAR}年 · 上位10県`, note: label.subtitle || undefined, source: label.source,
    body: `<svg x="${SAMPLE_FRAME.left}" y="${top}" width="${width}" height="${height}" viewBox="0 0 340 284">${table}</svg>`,
  });
}
