import { describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import {
  convertGeoJsonFilesToTopoJson,
  parseKsjGeoJsonText,
  partitionByLimits,
  transformTokyoDatumGeometry,
} from '../converter';

describe('Tokyo Datum conversion', () => {
  it('GeoJSONの入れ子座標をWGS84へ変換し高度を保持する', () => {
    const transformed = transformTokyoDatumGeometry({
      type: 'LineString',
      coordinates: [
        [139.75, 35.68, 10],
        [135.5, 34.7, 20],
      ],
    }) as { coordinates: number[][] };

    expect(transformed.coordinates[0][0]).not.toBe(139.75);
    expect(transformed.coordinates[0][0]).toBeGreaterThan(139.7);
    expect(transformed.coordinates[0][0]).toBeLessThan(139.8);
    expect(transformed.coordinates[0][1]).toBeGreaterThan(35.6);
    expect(transformed.coordinates[0][1]).toBeLessThan(35.8);
    expect(transformed.coordinates[0][2]).toBe(10);
  });

  it('同じarchive内の複数GeoJSONを1つのTopologyへ統合する', () => {
    const directory = mkdtempSync(join(tmpdir(), 'stats47-geojson-merge-'));
    try {
      const files = [1, 2].map((index) => {
        const file = join(directory, `${index}.geojson`);
        writeFileSync(file, JSON.stringify({
          type: 'FeatureCollection',
          features: [{
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [135 + index, 35] },
            properties: { index },
          }],
        }));
        return file;
      });
      const result = convertGeoJsonFilesToTopoJson(
        files,
        'test-data',
        { quantize: 1e6, simplifyQuantile: 0 }
      );
      expect(result.featureCount).toBe(2);
    } finally {
      rmSync(directory, { recursive: true, force: true });
    }
  });

  it('ファイル数と入力byte上限を超えない決定的なグループへ分割する', () => {
    const groups = partitionByLimits(
      [6, 4, 8, 2],
      (size) => size,
      { maxItems: 2, maxBytes: 10 }
    );
    expect(groups).toEqual([[6, 4], [8, 2]]);
    expect(partitionByLimits([11, 1], (size) => size, { maxItems: 2, maxBytes: 10 }))
      .toEqual([[11], [1]]);
  });

  it('公式GeoJSONのBOMと末尾NUL paddingだけを除去する', () => {
    const parsed = parseKsjGeoJsonText(
      '\uFEFF{"type":"FeatureCollection","features":[]}\r\n\u0000\u0000'
    );
    expect(parsed).toEqual({ type: 'FeatureCollection', features: [] });
    expect(() => parseKsjGeoJsonText(
      '{"type":"FeatureCollection",\u0000"features":[]}'
    )).toThrow();
  });
});
