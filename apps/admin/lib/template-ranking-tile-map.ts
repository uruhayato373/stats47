import { renderAll47TileSvg } from '../../remotion/src/features/data-cards/all47-svg';
import { resolveTileScale } from '../../remotion/src/features/data-cards/tile-scale';
import { LIGHT_THEME, type ChartTheme } from '../../remotion/src/features/data-cards/chart-theme';
import { rankingRows } from './template-ranking-bars';
import { assertRankingRows, isCapitalCityChart, sampleRankingChart, type RankingChart } from './template-ranking-data';

export const RANKING_TILE_MAP_SAMPLE_ID = 'maximum-temperature-tile-map';

export async function renderRankingTileMap(raw: unknown, theme: ChartTheme = LIGHT_THEME) {
  return renderTileMapChart(sampleRankingChart({ data: rankingRows(raw) }), theme);
}

/**
 * 4:5 images use one tile renderer (all47-svg.ts) and one colour resolver (tile-scale.ts), shared
 * with the X/Threads card and the Instagram map carousel.
 */
export function renderTileMapChart(chart: RankingChart, theme: ChartTheme = LIGHT_THEME) {
  const rows = assertRankingRows(chart.rows);
  const scale = resolveTileScale(chart.presentation, rows.map((row) => row.value), chart.display);
  if (!scale) throw Error('タイルマップの配色を解決できません。');
  return renderAll47TileSvg(
    rows.map((row) => ({ areaCode: row.area_code, areaName: row.area_name, value: row.value })),
    {
      title: chart.title, year: chart.yearLabel, unit: chart.unit, source: chart.source, note: chart.note, scale, formatValue: chart.formatValue, theme, baseAreaCode: chart.baseAreaCode,
      // Values of the prefectural capitals (the condition line says so) read by city: heading, tiles and legend counts.
      capitalCities: isCapitalCityChart(chart),
    }
  );
}
