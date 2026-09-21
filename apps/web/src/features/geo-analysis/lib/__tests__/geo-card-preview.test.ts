import {
  buildFloodPrefDetail,
  buildLandPricePrefDetail,
  type GeoAnalysisPrefDetail,
} from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import { getPrefectureCardGeography } from '../geo-card-geography';
import { buildGeoCardPreview } from '../geo-card-preview';
import { GEO_DEFAULT_PREF_CODE } from '../geo-default-prefecture';

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
  it('covers the whole default prefecture (兵庫県 incl. 淡路島) and keeps the same boundary projection when the population core changes', () => {
    expect(GEO_DEFAULT_PREF_CODE).toBe('28');
    const hyogo = getPrefectureCardGeography(GEO_DEFAULT_PREF_CODE);
    // Mainland spans the Japan Sea coast (north) to Osaka Bay; 淡路島 reaches south of 34.2.
    expect(hyogo.bounds[0]).toBeLessThan(134.3);
    expect(hyogo.bounds[2]).toBeGreaterThan(135.4);
    expect(hyogo.bounds[1]).toBeLessThan(34.2);
    expect(hyogo.bounds[3]).toBeGreaterThan(35.6);
    // Every polygon is kept: the mainland, 淡路島 and the small coastal islands.
    expect(hyogo.rings.length).toBeGreaterThan(2);
    const awaji = hyogo.rings.find((ring) =>
      ring.every(([, latitude]) => latitude < 34.62)
    );
    expect(awaji).toBeDefined();
    const north = {
      ...mesh,
      areaCode: '28000',
      meshId: 'north',
      longitude: 134.805,
      latitude: 35.505,
      bounds: [134.8, 35.5, 134.81, 35.51] as const,
      floodDepthClass: 1,
    };
    const awajiMesh = {
      ...mesh,
      areaCode: '28000',
      meshId: 'awaji',
      longitude: 134.905,
      latitude: 34.305,
      bounds: [134.9, 34.3, 134.91, 34.31] as const,
      floodDepthClass: 0,
    };
    const hyogoInput = { ...input, areaCode: '28000', areaName: '兵庫県' };
    const first = buildGeoCardPreview(
      buildFloodPrefDetail({ ...hyogoInput, meshes: [north, awajiMesh] }),
      hyogo
    );
    const second = buildGeoCardPreview(
      buildFloodPrefDetail({
        ...hyogoInput,
        meshes: [north, { ...awajiMesh, population2020: 10000 }],
      }),
      hyogo
    );
    expect(first.paths).toHaveLength(2);
    expect(first.boundary.length).toBeGreaterThan(100);
    expect(second.boundary).toBe(first.boundary);
    expect(second.paths).toEqual(first.paths);
  });

  it('throws for a prefecture code that is not in the topology instead of drawing nothing', () => {
    expect(() => getPrefectureCardGeography('99')).toThrow(/99/);
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
