'use server';
import { parseGeoLandslideManifest } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';

import { matchesGeoArtifact } from '../lib/geo-runtime-contract';

import type { FeatureCollection, Polygon } from 'geojson';
const slug = 'population-landslide-exposure',
  root = `app/geo/${slug}`;
const rec = (x: unknown): x is Record<string, unknown> =>
  typeof x === 'object' && x !== null && !Array.isArray(x);
const bbox = (x: unknown): x is [number, number, number, number] =>
  Array.isArray(x) &&
  x.length === 4 &&
  x.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
  x[0] >= 122 &&
  x[2] <= 154 &&
  x[1] >= 20 &&
  x[3] <= 46 &&
  x[0] < x[2] &&
  x[1] < x[3];
/** Bounded viewport request. A request never silently truncates a set of matching parts. */
export async function fetchGeoLandslideSourceAction(
  bounds: readonly [number, number, number, number],
  expected: { generatedAt: string }
): Promise<
  | { status: 'ready'; collection: FeatureCollection<Polygon> }
  | { status: 'zoom-in' | 'error' }
> {
  try {
    if (!bbox(bounds)) return { status: 'error' };
    const manifest = parseGeoLandslideManifest(
      await fetchFromR2AsJson<unknown>(`${root}/manifest.json`)
    );
    if (!manifest || manifest.generatedAt !== expected.generatedAt)
      return { status: 'error' };
    const outputs = manifest.stages.find(
        (s) => s.id === 'landslide-polygons'
      )!.outputs,
      indexArtifact = outputs.find(
        (a) => a.key === `${root}/source/index.json`
      );
    if (!indexArtifact) return { status: 'error' };
    const index = await fetchFromR2AsJson<unknown>(indexArtifact.key);
    if (
      !rec(index) ||
      index.slug !== slug ||
      index.generatedAt !== manifest.generatedAt ||
      index.displayOnly !== true ||
      !Array.isArray(index.parts) ||
      !(await matchesGeoArtifact(index, indexArtifact))
    )
      return { status: 'error' };
    const keyed = new Map(outputs.map((o) => [o.key, o])),
      seen = new Set();
    const parts = index.parts.filter(
      (
        p
      ): p is {
        key: string;
        bytes: number;
        sha256: string;
        bounds: [number, number, number, number];
      } => {
        if (
          !rec(p) ||
          typeof p.key !== 'string' ||
          seen.has(p.key) ||
          !bbox(p.bounds)
        )
          throw new Error('invalid display part');
        const a = keyed.get(p.key);
        if (
          !a ||
          a.sha256 !== p.sha256 ||
          a.bytes !== p.bytes ||
          a.areaCode === '26000' ||
          !/\d\d-\d{3}\.json$/.test(a.key)
        )
          throw new Error('unapproved display part');
        seen.add(p.key);
        return true;
      }
    );
    if (
      parts.length !==
      outputs.filter((a) => /\d\d-\d{3}\.json$/.test(a.key)).length
    )
      return { status: 'error' };
    const selected = parts.filter(
      (p) =>
        p.bounds[0] <= bounds[2] &&
        p.bounds[2] >= bounds[0] &&
        p.bounds[1] <= bounds[3] &&
        p.bounds[3] >= bounds[1]
    );
    if (
      selected.length > 12 ||
      selected.reduce((n, p) => n + p.bytes, 0) > 12000000
    )
      return { status: 'zoom-in' };
    const all: FeatureCollection<Polygon>['features'] = [];
    for (const p of selected) {
      const value = await fetchFromR2AsJson<unknown>(p.key);
      if (
        !rec(value) ||
        value.type !== 'FeatureCollection' ||
        !Array.isArray(value.features) ||
        !(await matchesGeoArtifact(value, keyed.get(p.key)!))
      )
        return { status: 'error' };
      for (const f of value.features) {
        if (
          !rec(f) ||
          f.type !== 'Feature' ||
          !rec(f.properties) ||
          ![1, 2, 4, 8, 16, 32].includes(Number(f.properties.mask)) ||
          !rec(f.geometry) ||
          f.geometry.type !== 'Polygon' ||
          !Array.isArray(f.geometry.coordinates)
        )
          return { status: 'error' };
        for (const r of f.geometry.coordinates) {
          if (
            !Array.isArray(r) ||
            r.length < 4 ||
            !r.every(
              (p) =>
                Array.isArray(p) &&
                p.length === 2 &&
                p.every((n) => typeof n === 'number' && Number.isFinite(n)) &&
                p[0] >= 122 &&
                p[0] <= 154 &&
                p[1] >= 20 &&
                p[1] <= 46
            ) ||
            JSON.stringify(r[0]) !== JSON.stringify(r[r.length - 1])
          )
            return { status: 'error' };
        }
        all.push(
          f as unknown as FeatureCollection<Polygon>['features'][number]
        );
      }
    }
    return {
      status: 'ready',
      collection: { type: 'FeatureCollection', features: all },
    };
  } catch {
    return { status: 'error' };
  }
}
