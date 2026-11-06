import fs from 'node:fs';
import path from 'node:path';
import { geoPath } from 'd3-geo';
import type { Feature } from 'geojson';
import { describe, expect, it } from 'vitest';
import { fittedMercator, largestPolygon, topologyFeatures } from '../geometry.mjs';

const ROOT = path.resolve(__dirname, '../../../../..');
const SCANNED = ['apps/remotion/src', 'apps/admin/lib', 'apps/admin/scripts', '.claude/scripts', 'packages'];
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
    expect(files.has('.claude/scripts/note/lib/cover-visuals.ts')).toBe(true);
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
});
