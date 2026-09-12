import { Readable } from 'node:stream';
import { describe, it, expect } from 'vitest';
import { readFeatureJson } from '../read-feature-json';

const features = [
  {
    type: 'Feature',
    properties: { name: '日本語の区域 { [ \\" }', number: 0 },
    geometry: {
      type: 'Polygon',
      coordinates: [
        [
          [139, 35],
          [140, 35],
          [140, 36],
          [139, 35],
        ],
      ],
    },
  },
  {
    type: 'Feature',
    properties: { name: '次の区域', nullable: null },
    geometry: {
      type: 'MultiPolygon',
      coordinates: [
        [
          [
            [140, 35],
            [141, 35],
            [141, 36],
            [140, 35],
          ],
        ],
      ],
    },
  },
];
describe('flood feature framing preserves original geometry and attributes', () => {
  for (const size of [1, 2, 7, 64, 10000])
    it(`handles UTF-8 and quoted braces across ${size}-byte chunks`, async () => {
      const bytes = Buffer.from(
        JSON.stringify({ type: 'FeatureCollection', features })
      );
      const chunks = [];
      for (let i = 0; i < bytes.length; i += size)
        chunks.push(bytes.subarray(i, i + size));
      const actual: unknown[] = [];
      const count = await readFeatureJson(Readable.from(chunks), (json) =>
        actual.push(JSON.parse(json))
      );
      expect(count).toBe(2);
      expect(actual).toEqual(features);
    });
  it('rejects truncated input before a completed source is recorded', async () => {
    await expect(
      readFeatureJson(
        Readable.from([Buffer.from(JSON.stringify({ features }).slice(0, -3))]),
        () => {}
      )
    ).rejects.toThrow();
  });
  it('rejects non-polygon features and empty collections', async () => {
    for (const input of [
      { features: [] },
      {
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [139, 35] },
          },
        ],
      },
    ])
      await expect(
        readFeatureJson(
          Readable.from([Buffer.from(JSON.stringify(input))]),
          () => {}
        )
      ).rejects.toThrow();
  });
});
