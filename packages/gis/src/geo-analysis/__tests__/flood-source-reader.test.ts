import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { readFloodFeatures } from '../flood-source-reader';

const feature = {
  type: 'Feature',
  properties: { A31b_201: 2 },
  geometry: {
    type: 'Polygon',
    coordinates: [
      [
        [0, 0],
        [1, 0],
        [1, 1],
        [0, 0],
      ],
    ],
  },
};
describe('洪水GeoJSONの逐次読込', () => {
  it('chunk境界に依存せず全地物を1回ずつ処理する', async () => {
    const json = JSON.stringify({
      type: 'FeatureCollection',
      features: [feature, feature],
    });
    const seen: unknown[] = [];
    expect(
      await readFloodFeatures(Readable.from([...json]), (value) => {
        seen.push(value);
      })
    ).toBe(2);
    expect(seen).toEqual([feature, feature]);
  });
  it('途中切断・不正地物・空入力を成功扱いしない', async () => {
    for (const json of [
      '{"features":[',
      '{"features":[]}',
      '{"features":[{}]}',
    ]) {
      await expect(
        readFloodFeatures(Readable.from([json]), () => {})
      ).rejects.toThrow();
    }
  });
});
