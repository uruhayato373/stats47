import { renderAll47TileSvg } from '../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { rankingRows } from './template-ranking-bars';
import { RANKING_SAMPLE_METRIC, RANKING_SAMPLE_YEAR, rankingSampleLabels } from './template-ranking-data';

export const RANKING_TILE_MAP_SAMPLE_ID = 'maximum-temperature-tile-map';

/**
 * 4:5 images use one tile renderer (all47-svg.ts) and one colour resolver (tile-scale.ts), shared
 * with the X/Threads card and the Instagram map carousel.
 */
export async function renderRankingTileMap(raw: unknown) {
  const rows = rankingRows(raw);
  const label = rankingSampleLabels();
  const scale = resolveTileScale(RANKING_SAMPLE_METRIC.visualization, rows.map((row) => row.value), RANKING_SAMPLE_METRIC.display);
  if (!scale) throw Error('タイルマップの配色を解決できません。');
  return renderAll47TileSvg(
    rows.map((row) => ({ areaCode: row.area_code, areaName: row.area_name, value: row.value })),
    {
      title: RANKING_SAMPLE_METRIC.title,
      year: `${RANKING_SAMPLE_YEAR}年`,
      unit: label.unit,
      source: label.source,
      note: label.subtitle || undefined,
      scale,
    }
  );
}
