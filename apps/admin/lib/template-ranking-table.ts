import { generateRankingTableSvg } from '../../../packages/svg-builder/src/tables/ranking-table';
import { RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { BRAND } from '../../web/src/features/ogp/brand';
import { escapeXml, rankingRows } from './template-ranking-bars';

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
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="72" font-weight="700">${escapeXml(label.title)}</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">${RANKING_SAMPLE_YEAR}年 · 上位10県</text>
      <text x="64" y="292" font-size="28" fill="${BRAND.muted}">${escapeXml(label.subtitle)}</text>
      <svg x="64" y="350" width="952" height="795.2" viewBox="0 0 340 284">${table}</svg>
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escapeXml(label.source)}</text>
    </g>
  </svg>`;
}
