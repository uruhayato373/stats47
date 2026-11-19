import fs from 'node:fs';
import path from 'node:path';
import { geoPath } from 'd3-geo';
import type { Feature } from 'geojson';
import { describe, expect, it } from 'vitest';
import { MAINLAND_BBOX, dropSmallIslands, fittedMercator, inMainlandBox, isMainlandFeature, isMainlandPolygon, largestPolygon, polygonAreaKm2, topologyFeatures } from '../geometry.mjs';

const ROOT = path.resolve(__dirname, '../../../../..');
const SCANNED = ['apps/remotion/src', 'apps/admin/lib', 'apps/admin/scripts', 'packages'];
const SKIPPED_DIRECTORIES = new Set(['node_modules', '.local', '__tests__', 'dist']);
// Interactive d3 on the site and a KML export: neither draws a static image or a video frame.
const OWN_PROJECTION = new Set([
  'packages/gis/src/map/geometry.mjs',
  'packages/gis/src/export/export-geojson-kml.ts',
  'packages/visualization/src/d3/components/DivergingChoroplethMap/DivergingChoroplethMap.tsx',
]);

function sourceFiles(directory: string): string[] {
  return fs.readdirSync(path.join(ROOT, directory), { withFileTypes: true }).flatMap((entry) => {
    const relative = `${directory}/${entry.name}`;
    if (entry.isDirectory()) return SKIPPED_DIRECTORIES.has(entry.name) ? [] : sourceFiles(relative);
    return /\.(ts|tsx|mjs|cjs|js)$/.test(entry.name) ? [relative] : [];
  });
}

describe('地図の土台', () => {
  it('静止画と動画の地図は投影を土台からだけ作る', () => {
    const own = SCANNED.flatMap(sourceFiles).filter((file) => !OWN_PROJECTION.has(file) && fs.readFileSync(path.join(ROOT, file), 'utf8').includes('geoMercator'));
    expect(own).toEqual([]);
  });

  it('対象の検索が実際に地図の処理を見ている', () => {
    const files = new Set(SCANNED.flatMap(sourceFiles));
    expect(files.has('apps/remotion/src/features/buzz-map/geo.ts')).toBe(true);
  });

  it('対象の名前の無い topology は最初の object を読み、object が無ければ空にする', () => {
    const topology = { type: 'Topology', arcs: [[[0, 0], [1, 1]]], objects: { pref: { type: 'GeometryCollection', geometries: [{ type: 'LineString', arcs: [0], properties: { code: '01' } }] } } } as never;
    expect(topologyFeatures(topology).features).toHaveLength(1);
    expect(topologyFeatures({ type: 'Topology', arcs: [], objects: {} } as never).features).toEqual([]);
  });

  it('最大の島だけを残し、属性を保つ', () => {
    const square = (x: number, size: number) => [[[x, 0], [x, size], [x + size, size], [x + size, 0], [x, 0]]];
    const prefecture: Feature = { type: 'Feature', properties: { code: '47' }, geometry: { type: 'MultiPolygon', coordinates: [square(0, 1), square(5, 3), square(10, 2)] } };
    const kept = largestPolygon(prefecture);
    expect(kept.geometry).toEqual({ type: 'Polygon', coordinates: square(5, 3) });
    expect(kept.properties).toEqual({ code: '47' });
  });

  it('箱に合わせた投影は形を箱の中に収める', () => {
    const square: Feature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: [[[130, 30], [130, 40], [140, 40], [140, 30], [130, 30]]] } };
    const [[x0, y0], [x1, y1]] = geoPath(fittedMercator([[10, 20], [110, 120]], square)).bounds(square);
    expect(Math.min(x0, y0)).toBeGreaterThanOrEqual(10);
    expect(Math.max(x1, y1)).toBeLessThanOrEqual(120);
  });

  it('本土の範囲は重心で判定し、範囲外の島と指定した範囲を区別する', () => {
    const square = (lon: number, lat: number, size: number) => [[[lon, lat], [lon, lat + size], [lon + size, lat + size], [lon + size, lat], [lon, lat]]];
    expect(MAINLAND_BBOX).toEqual({ west: 128.3, east: 146.3, south: 30.6, north: 45.9 });
    expect(inMainlandBox(135, 35)).toBe(true);
    expect(inMainlandBox(142, 27)).toBe(false); // 小笠原
    expect(inMainlandBox(130.5, 30.4)).toBe(false); // 範囲の南端 (30.6) より南
    expect(inMainlandBox(130.5, 30.4, { west: 128, east: 146, south: 30, north: 46 })).toBe(true);
    expect(isMainlandPolygon(square(135, 35, 1))).toBe(true);
    expect(isMainlandPolygon(square(142, 27, 1))).toBe(false);
    const feature: Feature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: square(135, 35, 1) } };
    expect(isMainlandFeature(feature)).toBe(true);
  });

  it('小さな島だけを外し、最大の多角形は閾値に関わらず残す', () => {
    // 緯度 35 度付近で 1 度四方は約 1.0 万 km²、0.1 度四方は約 100 km²。
    const square = (lon: number, size: number) => [[[lon, 35], [lon, 35 + size], [lon + size, 35 + size], [lon + size, 35], [lon, 35]]];
    expect(polygonAreaKm2(square(135, 0.1))).toBeGreaterThan(80);
    expect(polygonAreaKm2(square(135, 0.1))).toBeLessThan(130);
    const prefecture: Feature = { type: 'Feature', properties: { code: '28' }, geometry: { type: 'MultiPolygon', coordinates: [square(134, 0.1), square(135, 1), square(136, 0.3)] } };
    // 主島 (1 度) と 200 km² 以上の島 (0.3 度≒900 km²) が残り、約 100 km² の島が外れる。
    expect(dropSmallIslands(prefecture, 200).geometry).toEqual({ type: 'MultiPolygon', coordinates: [square(135, 1), square(136, 0.3)] });
    // 閾値が大きくても主島は残り、1 つになれば Polygon に戻る。
    expect(dropSmallIslands(prefecture, 1e9).geometry).toEqual({ type: 'Polygon', coordinates: square(135, 1) });
    expect(dropSmallIslands(prefecture, 200).properties).toEqual({ code: '28' });
    const single: Feature = { type: 'Feature', properties: {}, geometry: { type: 'Polygon', coordinates: square(135, 0.01) } };
    expect(dropSmallIslands(single, 1e9)).toBe(single);
  });
});
