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

  it('医療機関の名称・区分・診療科目・病床数を原典の意味どおりに保持する', () => {
    const directory = mkdtempSync(join(tmpdir(), 'stats47-medical-fields-'));
    try {
      const file = join(directory, 'medical.geojson');
      writeFileSync(
        file,
        JSON.stringify({
          type: 'FeatureCollection',
          features: [
            {
              type: 'Feature',
              geometry: { type: 'Point', coordinates: [135, 35] },
              properties: {
                P04_001: 2,
                P04_002: '地域診療所',
                P04_003: '所在地',
                P04_004: '内科',
                P04_005: '小児科',
                P04_006: null,
                P04_007: 9,
                P04_008: 19,
              },
            },
          ],
        })
      );
      const result = convertGeoJsonFilesToTopoJson([file], 'P04', {
        quantize: 0,
        simplifyQuantile: 0,
      });
      const object = Object.values(result.topology.objects)[0];
      expect(object.type).toBe('GeometryCollection');
      if (object.type !== 'GeometryCollection')
        throw new Error('Expected collection');
      expect(object.geometries[0].properties).toEqual({
        facilityType: 2,
        facilityName: '地域診療所',
        address: '所在地',
        departments1: '内科',
        departments2: '小児科',
        departments3: null,
        administratorType: 9,
        beds: 19,
      });
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
