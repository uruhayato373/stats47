import { TILE_GRID_LAYOUT, type TileGridCell } from "@stats47/visualization";

/**
 * 動画用タイルグリッド配置。
 *
 * 正典の TILE_GRID_LAYOUT (@stats47/visualization) に、画面の縦横比ごとの
 * 地域オフセットを適用したもの。各コンポーネントで同じオフセット表を
 * 再定義しないためにここへ 1 回だけ置く。
 */

type TileOffset = { dx: number; dy: number };

function applyTileOffsets(offsets: Record<number, TileOffset>): TileGridCell[] {
  return TILE_GRID_LAYOUT.map((cell) => {
    const offset = offsets[cell.id];
    if (!offset) return cell;
    return { ...cell, x: cell.x + offset.dx, y: cell.y + offset.dy };
  });
}

/**
 * 横長 (16:9) 用オフセット (元 TILE_GRID_LAYOUT からの差分)。
 * 北海道〜中国 (id:1〜35) と四国 (id:36〜39) は元の位置を維持し、
 * 九州 (id:40〜46) を 1 マス左・2 段上、沖縄 (id:47) を 1 マス左・3 段上へ寄せる。
 * → 14 列 × 14 行のコンパクトなグリッド
 */
const LANDSCAPE_TILE_OFFSETS: Record<number, TileOffset> = Object.fromEntries([
  ...[36, 37, 38, 39].map((id) => [id, { dx: 0, dy: 0 }]),
  ...[40, 41, 42, 43, 44, 45, 46].map((id) => [id, { dx: -1, dy: -2 }]),
  [47, { dx: -1, dy: -3 }],
]);

/**
 * 縦長 (9:16) 用オフセット。九州・四国を +1 右 +1 下にずらして
 * グリッドを 13 列 × 17 行に圧縮し、セルサイズを拡大する。
 */
const PORTRAIT_TILE_OFFSETS: Record<number, TileOffset> = Object.fromEntries([
  // 四国 (id: 36-39)
  ...[36, 37, 38, 39].map((id) => [id, { dx: 1, dy: 1 }]),
  // 九州・沖縄 (id: 40-47)
  ...[40, 41, 42, 43, 44, 45, 46, 47].map((id) => [id, { dx: 1, dy: 1 }]),
]);

/** 横長 (16:9) 動画用のオフセット適用済みレイアウト */
export const LANDSCAPE_TILE_LAYOUT: TileGridCell[] = applyTileOffsets(LANDSCAPE_TILE_OFFSETS);

/** 縦長 (9:16) 動画用のオフセット適用済みレイアウト */
export const PORTRAIT_TILE_LAYOUT: TileGridCell[] = applyTileOffsets(PORTRAIT_TILE_OFFSETS);
