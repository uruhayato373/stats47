export interface GeoXRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export const GEO_X_CANVAS = { width: 1080, height: 1350 } as const;

export interface GeoXMapTransform {
  readonly translateX: number;
  readonly translateY: number;
  readonly scale: number;
}

/** JapanMap の実描画と衝突テストで共有する変形値。 */
export const GEO_X_MAP_TRANSFORMS = {
  mainland: { translateX: 170, translateY: -150, scale: 0.78 },
  inset: { translateX: 24, translateY: 282, scale: 0.38 },
} as const satisfies Record<string, GeoXMapTransform>;

/**
 * Geo Xカードの排他的な描画領域。
 * 地図上へ本文パネルを重ねず、沖縄インセットもmapStage内だけで描画する。
 */
export const GEO_X_LAYOUT = {
  header: { x: 48, y: 34, width: 984, height: 230 },
  mapStage: { x: 0, y: 276, width: 1080, height: 750 },
  legend: { x: 48, y: 1042, width: 984, height: 64 },
  insight: { x: 48, y: 1122, width: 984, height: 164 },
  footer: { x: 48, y: 1306, width: 984, height: 28 },
  okinawaInset: { x: 44, y: 650, width: 194, height: 170 },
} as const satisfies Record<string, GeoXRect>;

export function rectsOverlap(left: GeoXRect, right: GeoXRect): boolean {
  return !(
    left.x + left.width <= right.x ||
    right.x + right.width <= left.x ||
    left.y + left.height <= right.y ||
    right.y + right.height <= left.y
  );
}

export function rectContains(parent: GeoXRect, child: GeoXRect): boolean {
  return (
    child.x >= parent.x &&
    child.y >= parent.y &&
    child.x + child.width <= parent.x + parent.width &&
    child.y + child.height <= parent.y + parent.height
  );
}

export function transformMapRect(
  rect: GeoXRect,
  transform: GeoXMapTransform,
): GeoXRect {
  return {
    x: GEO_X_LAYOUT.mapStage.x + transform.translateX + rect.x * transform.scale,
    y: GEO_X_LAYOUT.mapStage.y + transform.translateY + rect.y * transform.scale,
    width: rect.width * transform.scale,
    height: rect.height * transform.scale,
  };
}

export const GEO_X_EXCLUSIVE_REGION_PAIRS = [
  ['header', 'mapStage'],
  ['header', 'legend'],
  ['header', 'insight'],
  ['header', 'footer'],
  ['mapStage', 'legend'],
  ['mapStage', 'insight'],
  ['mapStage', 'footer'],
  ['legend', 'insight'],
  ['legend', 'footer'],
  ['insight', 'footer'],
] as const;
