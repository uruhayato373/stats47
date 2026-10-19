import { RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';
import { BRAND } from '../../web/src/features/ogp/brand';
import { escapeXml, rankingRows } from './template-ranking-bars';

export const RANKING_TABLE_SAMPLE_ID = 'maximum-temperature-table';
const TABLE = { left: 64, right: 1016, headerTop: 350, headerHeight: 64, rowHeight: 74 } as const;

/** Read values in aligned columns; bars and axes belong to the bar-chart form. */
export function renderRankingTable(raw: unknown) {
  const label = rankingSampleLabels();
  const rows = rankingRows(raw).slice(0, 10);
  const body = rows.map((row, i) => {
    const top = TABLE.headerTop + TABLE.headerHeight + i * TABLE.rowHeight;
    const baseline = top + 51;
    return `<g data-rank="${row.rank}" data-value="${row.value}">
      <rect x="${TABLE.left}" y="${top}" width="${TABLE.right - TABLE.left}" height="${TABLE.rowHeight}" fill="${i % 2 === 0 ? BRAND.white : BRAND.paper}"/>
      <line x1="${TABLE.left}" x2="${TABLE.right}" y1="${top + TABLE.rowHeight}" y2="${top + TABLE.rowHeight}" stroke="${BRAND.line}"/>
      <text x="156" y="${baseline}" text-anchor="middle" font-size="42" font-weight="700" fill="${BRAND.primary}">${row.rank}</text>
      <text x="286" y="${baseline}" font-size="46" font-weight="600">${escapeXml(row.area_name)}</text>
      <text x="976" y="${baseline}" text-anchor="end" font-size="48" font-weight="700">${label.formatValue(row.value)}</text>
    </g>`;
  }).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="72" font-weight="700">${escapeXml(label.title)}</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">${RANKING_SAMPLE_YEAR}年 · 上位10県</text>
      <text x="64" y="292" font-size="28" fill="${BRAND.muted}">${escapeXml(label.subtitle)}</text>
      <rect x="${TABLE.left}" y="${TABLE.headerTop}" width="${TABLE.right - TABLE.left}" height="${TABLE.headerHeight}" rx="4" fill="${BRAND.primary}"/>
      <g fill="${BRAND.white}" font-size="32" font-weight="700">
        <text x="156" y="394" text-anchor="middle">順位</text>
        <text x="286" y="394">都道府県</text>
        <text x="976" y="394" text-anchor="end">${escapeXml(label.title.replace(/ランキング$/, ""))}（${escapeXml(label.unit)}）</text>
      </g>
      ${body}
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escapeXml(label.source)}</text>
    </g>
  </svg>`;
}
