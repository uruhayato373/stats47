import { describe, expect, it } from 'vitest';
import type { FeatureCollection, Polygon } from 'geojson';
import { applyFloodFeatures } from '../flood-exposure';
import { buildFloodPrefDetail } from '../content-details';
import type { PopulationMeshPoint } from '../geo-analysis-core';

function polygons(
  depth: number
): FeatureCollection<Polygon, Record<string, unknown>> {
  return {
    type: 'FeatureCollection',
    features: [
      {
        type: 'Feature',
        properties: { A31b_201: depth },
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [139.7, 35.6],
              [139.7125, 35.6],
              [139.7125, 35.608333],
              [139.7, 35.608333],
              [139.7, 35.6],
            ],
          ],
        },
      },
    ],
  };
}

describe('河川区分をまたぐ洪水包含の和集合', () => {
  it('両区分の重複区域でも人口を二重計上せず、順序にも依存しない', () => {
    for (const depths of [
      [2, 3],
      [3, 2],
    ]) {
      const meshes: PopulationMeshPoint[] = [
        {
          meshId: '53394525',
          areaCode: '13000',
          longitude: 139.70625,
          latitude: 35.6041665,
          bounds: [139.7, 35.6, 139.7125, 35.608333],
          population2020: 100,
          population2050: 80,
        },
      ];
      for (const depth of depths)
        expect(applyFloodFeatures(polygons(depth), meshes)).toBe(1);
      expect(meshes[0]?.floodDepthClass).toBe(3);
      const detail = buildFloodPrefDetail({
        generatedAt: '2026-09-05',
        areaCode: '13000',
        areaName: '東京都',
        meshes,
      });
      expect(detail.summary).toMatchObject({
        meshCount: 1,
        exposedMeshCount: 1,
        exposedPopulation2050: 80,
        floodExposureShare2050: 100,
      });
    }
  });
});
