// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { withoutFarIslands } from '../geo-topology';

import type { Feature, MultiPolygon, Polygon } from 'geojson';

/** 経度・緯度を中心にした一辺 size 度の四角 */
const square = (lon: number, lat: number, size: number): number[][][] => [
  [
    [lon, lat],
    [lon + size, lat],
    [lon + size, lat + size],
    [lon, lat + size],
    [lon, lat],
  ],
];

describe('withoutFarIslands', () => {
  it('県の形に含まれる遠い離島 (小笠原諸島の位置) を外し、本土と近い島を残す', () => {
    // 東京都の本土 (大) + 伊豆大島の位置 (近い・小) + 小笠原諸島の位置 (約 1,000km 先・小) を 1 つの形に持つ
    const tokyo: Feature<MultiPolygon> = {
      type: 'Feature',
      properties: { N03_007: '13' },
      geometry: { type: 'MultiPolygon', coordinates: [square(139, 35.5, 0.6), square(139.35, 34.7, 0.1), square(142.1, 27, 0.1)] },
    };
    const kanagawa: Feature<Polygon> = {
      type: 'Feature',
      properties: { N03_007: '14' },
      geometry: { type: 'Polygon', coordinates: square(139, 35.1, 0.4) },
    };
    const lats = withoutFarIslands([tokyo, kanagawa]).map((f) => (f.geometry as Polygon).coordinates[0][0][1]);
    expect(lats).toContain(34.7);
    expect(lats).not.toContain(27);
  });

  it('陸地が 1 つだけなら元の地物を返す', () => {
    const one: Feature<Polygon> = { type: 'Feature', properties: null, geometry: { type: 'Polygon', coordinates: square(139, 35, 1) } };
    expect(withoutFarIslands([one])).toEqual([one]);
  });
});
