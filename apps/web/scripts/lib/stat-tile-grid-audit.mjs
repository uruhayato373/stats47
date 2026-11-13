const PANEL_GRID = /<PanelGrid\b[\s\S]*?<\/PanelGrid>/g;
const STAT_TILE_GRID = /<StatTileGrid\b[\s\S]*?<\/StatTileGrid>/g;
const STAT_TILE = /<StatTile\b/g;

/**
 * PanelGrid に直に 2 枚以上置いた数値タイル (StatTile) を返す。
 * 数値タイルを 2 枚以上並べる格子だけを見る (地図の横に 1 枚置くような、ページの組み立ての格子は対象外)。
 * PanelGrid の中の StatTileGrid に置いたタイルは数えない (列の数は StatTileGrid が持っている)。
 */
export function findStatTilesOutsideGrid(text) {
  const found = [];
  for (const match of text.matchAll(PANEL_GRID)) {
    if ((match[0].replace(STAT_TILE_GRID, '').match(STAT_TILE) ?? []).length < 2) continue;
    found.push({ index: match.index, line: match[0].split('\n')[0] });
  }
  return found;
}
