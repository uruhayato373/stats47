import {
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import { getTokyoMainlandGeography } from '../geo-card-geography';
import { buildGeoCardPreview } from '../geo-card-preview';

const geography = { rings: [], bounds: [138.65, 34.84, 140, 35.9] as const };

import { geoArtifactBundleFixture } from './geo-artifact-bundle-fixture';

const mesh = {
  meshId: 'core',
  areaCode: '13000',
  longitude: 139.005,
  latitude: 35.005,
  bounds: [139, 35, 139.01, 35.01] as const,
  population2020: 100,
  population2050: 80,
};
const input = {
  generatedAt: '2026-09-08',
  areaCode: '13000',
  areaName: '東京都',
};

describe('Geo card previews preserve the published spatial classifications', () => {
  it('includes western Tokyo and keeps the same boundary projection when the population core changes', () => {
    const mainland = getTokyoMainlandGeography();
    expect(mainland.bounds[0]).toBeLessThan(139);
    expect(mainland.bounds[2]).toBeGreaterThan(139.9);
    expect(mainland.bounds[1]).toBeGreaterThan(35.4);
    const west = {
      ...mesh,
      meshId: 'west',
      longitude: 139.005,
      latitude: 35.805,
      bounds: [139, 35.8, 139.01, 35.81] as const,
      floodDepthClass: 1,
    };
    const east = {
      ...mesh,
      meshId: 'east',
      longitude: 139.805,
      latitude: 35.705,
      bounds: [139.8, 35.7, 139.81, 35.71] as const,
      floodDepthClass: 0,
    };
    const first = buildGeoCardPreview(
      buildFloodPrefDetail({ ...input, meshes: [west, east] }),
      mainland
    );
    const second = buildGeoCardPreview(
      buildFloodPrefDetail({
        ...input,
        meshes: [west, { ...east, population2020: 10000 }],
      }),
      mainland
    );
    expect(first.paths).toHaveLength(2);
    expect(first.boundary.length).toBeGreaterThan(100);
    expect(second.boundary).toBe(first.boundary);
    expect(second.paths).toEqual(first.paths);
  });

  it('fits complete edge meshes inside the image rather than clipping at its border', () => {
    const detail = buildFloodPrefDetail({
      ...input,
      meshes: [
        { ...mesh, floodDepthClass: 1 },
        {
          ...mesh,
          meshId: 'edge',
          population2020: 1,
          bounds: [138.65, 34.84, 138.67, 34.86],
          floodDepthClass: 0,
        },
      ],
    });
    const preview = buildGeoCardPreview(detail, geography);
    expect(preview.paths).toHaveLength(2);
    for (const path of preview.paths) {
      const coordinates = path.d.match(/-?\d+(?:\.\d+)?/g)!.map(Number);
      // Check complete rectangles against the inset bounds, not just their centers.
      const rectangles = [
        ...path.d.matchAll(/M([\d.]+),([\d.]+)H([\d.]+)V([\d.]+)H([\d.]+)Z/g),
      ];
      expect(rectangles.length).toBeGreaterThan(0);
      expect(coordinates.every(Number.isFinite)).toBe(true);
      for (const rect of rectangles) {
        expect(Number(rect[1])).toBeGreaterThanOrEqual(24);
        expect(Number(rect[3])).toBeLessThanOrEqual(616);
        expect(Number(rect[2])).toBeGreaterThanOrEqual(48);
        expect(Number(rect[4])).toBeLessThanOrEqual(312);
      }
    }
  });

  it('renders the published station accessibility flag and station representative point', () => {
    const detail = geoArtifactBundleFixture('population-station-access').get(
      'pref/13'
    ) as GeoAnalysisPrefDetail;
    const preview = buildGeoCardPreview(detail, geography);
    expect(preview.paths.map((path) => path.color)).toEqual(['#0f766e']);
    expect(preview.points).toHaveLength(1);
    expect(preview.points[0].color).toBe('#f8fafc');
    expect(preview.points[0].x).toBeGreaterThanOrEqual(24);
    expect(preview.points[0].x).toBeLessThanOrEqual(616);
  });

  it('distinguishes flood inclusion from exclusion without changing the source', () => {
    const detail = buildFloodPrefDetail({
      ...input,
      meshes: [
        { ...mesh, floodDepthClass: 2 },
        {
          ...mesh,
          meshId: 'outside',
          bounds: [139.01, 35, 139.02, 35.01],
          floodDepthClass: 0,
        },
      ],
    });
    const before = JSON.stringify(detail);
    expect(
      buildGeoCardPreview(detail, geography).paths.map((path) => path.color)
    ).toEqual(['#b91c1c', '#cbd5e1']);
    expect(JSON.stringify(detail)).toBe(before);
  });

  it('highlights rising-price/declining-population points without treating missing data as a match', () => {
    const detail = buildLandPricePrefDetail({
      ...input,
      meshes: [mesh],
      points: [1, null].map((change, index) => ({
        id: String(index),
        areaCode: '13000',
        longitude: 139.005,
        latitude: 35.005,
        price: 10000,
        change,
      })),
    });
    const preview = buildGeoCardPreview(detail, geography);
    expect(preview.points.map((point) => point.color)).toEqual([
      '#b91c1c',
      '#64748b',
    ]);
    expect(preview.points[0].x).toBeGreaterThanOrEqual(24);
    expect(preview.points[0].x).toBeLessThanOrEqual(616);
    expect(preview.points[0].y).toBeGreaterThanOrEqual(48);
    expect(preview.points[0].y).toBeLessThanOrEqual(312);
  });

  it('crops remote islands from the preview without removing them from the analysis', () => {
    const detail = buildFloodPrefDetail({
      ...input,
      meshes: [
        { ...mesh, floodDepthClass: 0 },
        {
          ...mesh,
          meshId: 'island',
          population2020: 1,
          bounds: [142, 26, 142.01, 26.01],
          floodDepthClass: 2,
        },
      ],
    });
    expect(
      buildGeoCardPreview(detail, geography).paths.map((path) => path.color)
    ).toEqual(['#cbd5e1']);
    expect(detail.meshes).toHaveLength(2);
  });
});
