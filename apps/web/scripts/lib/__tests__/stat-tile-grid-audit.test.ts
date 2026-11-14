// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { findStatTilesOutsideGrid } from '../stat-tile-grid-audit.mjs';

describe('findStatTilesOutsideGrid', () => {
  it('PanelGrid に直に 2 枚以上置いた StatTile を検出する', () => {
    const result = findStatTilesOutsideGrid(`
      <PanelGrid className="grid-cols-2">
        <StatTile label="人口" value="100" />
        <StatTile label="面積" value="200" />
      </PanelGrid>
    `);

    expect(result).toHaveLength(1);
    expect(result[0].line).toBe('<PanelGrid className="grid-cols-2">');
  });

  it('PanelGrid の中の StatTileGrid に置いたタイルは、何枚書いても検出しない', () => {
    const result = findStatTilesOutsideGrid(`
      <PanelGrid>
        <StatTileGrid>
          <StatTile label="人口" value="100" />
          <StatTile label="面積" value="200" />
        </StatTileGrid>
        <ChartPanel title="推移" />
      </PanelGrid>
    `);

    expect(result).toEqual([]);
  });

  it('StatTileGrid の外に 2 枚以上あれば、StatTileGrid が同じ格子にあっても検出する', () => {
    const result = findStatTilesOutsideGrid(`
      <PanelGrid>
        <StatTileGrid>
          <StatTile label="人口" value="100" />
        </StatTileGrid>
        <StatTile label="面積" value="200" />
        <StatTile label="密度" value="0.5" />
      </PanelGrid>
    `);

    expect(result).toHaveLength(1);
  });

  it('地図の横に 1 枚だけ置く、ページの組み立ての格子は検出しない', () => {
    const result = findStatTilesOutsideGrid(`
      <PanelGrid>
        <MapPanel />
        <StatTile label="人口" value="100" />
      </PanelGrid>
    `);

    expect(result).toEqual([]);
  });
});
