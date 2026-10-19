import { BRAND } from '../../web/src/features/ogp/brand';
import { generateChoroplethSvg } from '../../../packages/svg-builder/src/charts/choropleth';
import { escapeXml, rankingRows } from './template-ranking-bars';
import { resolveChoroplethScale, createLegendFormatter } from '../../../packages/visualization/src/server';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';

export const RANKING_TILE_MAP_SAMPLE_ID = 'maximum-temperature-tile-map';

/** Reuse the published note/site renderer, including prefecture spans and island separation. */
export async function renderRankingTileMap(raw: unknown) {
  const rows = rankingRows(raw);
  const label = rankingSampleLabels();
  const resolvedScale = await resolveChoroplethScale(RANKING_SAMPLE_METRIC.visualization, rows.map((row) => ({ areaCode: row.area_code, value: row.value })));
  const midpoint = 'midpoint' in resolvedScale ? resolvedScale.midpoint : undefined;
  const formatBoundary = createLegendFormatter(
    [...resolvedScale.boundaries, ...(midpoint === undefined ? [] : [midpoint])],
    RANKING_SAMPLE_METRIC.display?.conversionFactor ?? 1,
    resolvedScale.method === 'threshold' ? undefined : RANKING_SAMPLE_METRIC.display?.decimalPlaces
  );
  const map = generateChoroplethSvg(
    rows.map((row) => ({ code: row.area_code, name: row.area_name, value: row.value })),
    {
      title: '',
      ariaLabel: '最高気温・全47都道府県',
      unit: label.unit,
      resolvedScale,
      formatBoundary,
      showValue: true,
      showRankList: false,
      formatValue: label.formatValue,
    }
  );
  // Compose a single viewport: a nested SVG clipped the surrounding header during PNG rasterization.
  const mapBody = map.replace(/^<svg\b[^>]*>/, '').replace(/<\/svg>\s*$/, '');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350" viewBox="0 0 1080 1350">
    <rect width="1080" height="1350" fill="${BRAND.paper}"/>
    <g transform="translate(0 100) scale(1.5)">${mapBody}</g>
    <g font-family="Noto Sans JP, Yu Gothic, Meiryo, sans-serif" fill="${BRAND.ink}">
      <text x="64" y="86" font-size="42" font-weight="700">stats47</text>
      <text x="64" y="184" font-size="72" font-weight="700">${escapeXml(label.title)}</text>
      <text x="64" y="246" font-size="32" fill="${BRAND.muted}">${RANKING_SAMPLE_YEAR}年 · 全47都道府県 · 単位：${escapeXml(label.unit)}</text>
      <text x="64" y="292" font-size="28" fill="${BRAND.muted}">${escapeXml(label.subtitle)}</text>
      <line x1="64" x2="1016" y1="1190" y2="1190" stroke="${BRAND.line}"/>
      <text x="64" y="1235" font-size="28" fill="${BRAND.muted}">出典：${escapeXml(label.source)}</text>
    </g>
  </svg>`;
}
