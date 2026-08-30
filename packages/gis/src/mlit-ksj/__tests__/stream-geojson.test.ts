import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

import { streamGeoJsonFeatureBatches } from '../stream-geojson';

describe('streamGeoJsonFeatureBatches', () => {
  it('chunk境界・文字列内の括弧・日本語を壊さずFeature単位で分割する', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'stats47-stream-geojson-'));
    const file = join(directory, 'large.geojson');
    try {
      writeFileSync(file, JSON.stringify({
        type: 'FeatureCollection',
        name: 'テスト',
        features: Array.from({ length: 5 }, (_, index) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [130 + index, 30] },
          properties: { index, label: `値{${index}}\\"` },
        })),
      }));
      const batches = [];
      for await (const batch of streamGeoJsonFeatureBatches(file, {
        maxFeatures: 2,
        maxBytes: 10_000,
        highWaterMark: 7,
      })) {
        batches.push(batch);
      }
      expect(batches.map((batch) => batch.length)).toEqual([2, 2, 1]);
      expect(batches.flat().map((feature) => feature.properties?.index))
        .toEqual([0, 1, 2, 3, 4]);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('閉じていないFeatureCollectionを拒否する', async () => {
    const directory = mkdtempSync(join(tmpdir(), 'stats47-stream-geojson-bad-'));
    const file = join(directory, 'bad.geojson');
    try {
      writeFileSync(
        file,
        '{"type":"FeatureCollection","features":[{"type":"Feature","geometry":null,"properties":null}'
      );
      const consume = async () => {
        for await (const _batch of streamGeoJsonFeatureBatches(file, {
          maxFeatures: 2,
          maxBytes: 100,
          highWaterMark: 5,
        })) {
          // consume
        }
      };
      await expect(consume()).rejects.toThrow('Incomplete GeoJSON');
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });
});
