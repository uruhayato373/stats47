import { describe, it, expect } from 'vitest';
import { TILE_GRID_LAYOUT, TileGridCell } from '../../constants/tile-grid-layout';

describe('TILE_GRID_LAYOUT', () => {
  // 47都道府県すべてが定義されている
  it('should define all 47 prefectures', () => {
    expect(TILE_GRID_LAYOUT.length).toBe(47);
    const prefectureIds = TILE_GRID_LAYOUT.map(cell => cell.id).sort((a, b) => a - b);
    for (let i = 1; i <= 47; i++) {
      expect(prefectureIds).toContain(i);
    }
  });

  // 座標の重複がない
  it('should not have duplicate coordinates for any prefecture', () => {
    const coordinates = new Set<string>();
    TILE_GRID_LAYOUT.forEach(cell => {
      // w, h が undefined の場合は 1 とする
      const w = cell.w ?? 1;
      const h = cell.h ?? 1;

      for (let x = cell.x; x < cell.x + w; x++) {
        for (let y = cell.y; y < cell.y + h; y++) {
          const coordKey = `${x},${y}`;
          expect(coordinates.has(coordKey)).toBeFalsy(); // 引数を削除
          if (coordinates.has(coordKey)) { // 重複があった場合、より詳細なエラーメッセージを出力
            throw new Error(`Duplicate coordinate found at ${coordKey} for prefecture ${cell.name}`);
          }
          coordinates.add(coordKey);
        }
      }
    });
  });

  // 各都道府県がユニークなIDを持っていること
  it('should have unique IDs for all prefectures', () => {
    const ids = TILE_GRID_LAYOUT.map(cell => cell.id);
    const uniqueIds = new Set(ids);
    expect(ids.length).toBe(uniqueIds.size);
  });

  // 各都道府県がユニークな名前を持っていること
  it('should have unique names for all prefectures', () => {
    const names = TILE_GRID_LAYOUT.map(cell => cell.name);
    const uniqueNames = new Set(names);
    expect(names.length).toBe(uniqueNames.size);
  });
});
