import { createHash } from 'node:crypto';

import { LANDSLIDE_EXPOSURE_SOURCE as source } from '@stats47/data-configs/theme-catalog';
import { expectedLandslideInputs, LANDSLIDE_STAGES, LANDSLIDE_EXPOSURE_DEFINITION_SHA256, parseGeoLandslideManifest } from '@stats47/gis';
import { beforeEach, describe, it, expect, vi } from 'vitest';

const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@stats47/r2-storage/server', () => ({
  fetchFromR2AsJson: mock.fetch,
}));
import { fetchGeoLandslideSourceAction } from '../actions/fetch-landslide-source';
// 小さな合成図形を使い、source-only checkout でも実際のparser/hash検査を通す。
const root = source.r2Root;
const generatedAt = '2026-09-11T00:00:00.000Z';
const key = `${root}/manifest.json`;
const files: Record<string, unknown> = {};
const artifact = (key: string, value: unknown, areaCode?: string) => {
  const body = `${JSON.stringify(value)}\n`;
  files[key] = value;
  return { key, bytes: Buffer.byteLength(body), sha256: createHash('sha256').update(body).digest('hex'), recordCount: 1, ...(areaCode ? { areaCode } : {}) };
};
const parts = Array.from({ length: 13 }, (_, i) => {
  const west = 141.3 + i * 0.2;
  const bounds = [west, 43, west + 0.1, 43.1];
  const collection = { type: 'FeatureCollection', features: [{ type: 'Feature', properties: { mask: 1 }, geometry: { type: 'Polygon', coordinates: [[[west, 43], [west + 0.1, 43], [west, 43.1], [west, 43]]] } }] };
  return { ...artifact(`${root}/source/01-${String(i).padStart(3, '0')}.json`, collection, '01000'), bounds };
});
const index = artifact(`${root}/source/index.json`, { slug: source.slug, generatedAt, displayOnly: true, parts });
const placeholder = (key: string, areaCode?: string) => ({ key, areaCode, bytes: 2, sha256: 'a'.repeat(64), recordCount: 0 });
const aggregate = { ...placeholder(`${root}/item.json`), recordCount: 47 };
const manifest = {
  schemaVersion: 1, slug: source.slug, generatedAt,
  definitionSha256: LANDSLIDE_EXPOSURE_DEFINITION_SHA256,
  inputs: expectedLandslideInputs(), aggregate,
  quality: { expectedAreas: 47, detailAreas: 47, conservationChecks: 46, maxDetailBytes: 1000 },
  stages: LANDSLIDE_STAGES.map((stage, i) => {
    const dir = i === 1 ? 'facilities' : i === 2 ? 'source' : 'pref';
    return {
      id: stage[0], kind: stage[1], role: stage[2], inputIds: stage.slice(3), label: stage[0], operation: 'synthetic test fixture',
      outputKeyPattern: i === 4 ? `${root}/item.json` : `${root}/${dir}/{prefCode}.json`,
      outputs: i === 4 ? [aggregate] : [
        ...source.populationSources.map((p) => placeholder(`${root}/${dir}/${p.areaCode.slice(0, 2)}.json`, p.areaCode)),
        ...(i === 2 ? [index, ...parts.map((part) => ({ key: part.key, bytes: part.bytes, sha256: part.sha256, recordCount: part.recordCount, areaCode: part.areaCode }))] : []),
      ],
    };
  }),
};
files[key] = manifest;
const read = (key: string) => files[key] === undefined ? null : JSON.parse(JSON.stringify(files[key]));
describe('landslide source viewport loader', () => {
  it('uses a manifest accepted by the production parser', () => {
    expect(parseGeoLandslideManifest(manifest)).not.toBeNull();
  });
  beforeEach(() => {
    mock.fetch.mockReset();
    mock.fetch.mockImplementation(async (k: string) => read(k));
  });
  it('rejects invalid bounds before reading any artifact', async () => {
    expect(
      await fetchGeoLandslideSourceAction([140, 43, 139, 44], {
        generatedAt: manifest.generatedAt,
      })
    ).toEqual({ status: 'error' });
    expect(mock.fetch).not.toHaveBeenCalled();
  });
  it('rejects a stale bundle version', async () =>
    expect(
      await fetchGeoLandslideSourceAction([141.3, 43, 141.4, 43.1], {
        generatedAt: 'old',
      })
    ).toEqual({ status: 'error' }));
  it('asks to zoom in rather than silently truncating a nationwide source request', async () => {
    expect(
      await fetchGeoLandslideSourceAction([122, 20, 154, 46], {
        generatedAt: manifest.generatedAt,
      })
    ).toEqual({ status: 'zoom-in' });
    expect(
      mock.fetch.mock.calls.some((c) => /\d\d-\d{3}\.json$/.test(c[0]))
    ).toBe(false);
  });
  it('loads complete pinned display parts for a small viewport', async () => {
    const r = await fetchGeoLandslideSourceAction(
      [141.32, 43.02, 141.34, 43.04],
      { generatedAt: manifest.generatedAt }
    );
    expect(r.status).toBe('ready');
    if (r.status === 'ready')
      expect(r.collection.features.length).toBeGreaterThan(0);
  });
  it('rejects a modified polygon even when the JSON shape is valid', async () => {
    mock.fetch.mockImplementation(async (k: string) => {
      const x = read(k);
      if (/\d\d-\d{3}\.json$/.test(k))
        x.features[0].geometry.coordinates[0][0][0] += 0.000001;
      return x;
    });
    expect(
      await fetchGeoLandslideSourceAction([141.32, 43.02, 141.34, 43.04], {
        generatedAt: manifest.generatedAt,
      })
    ).toEqual({ status: 'error' });
  });
  it('does not silently return an empty map when a source part is missing', async () => {
    mock.fetch.mockImplementation(async (k: string) =>
      /\d\d-\d{3}\.json$/.test(k) ? null : read(k)
    );
    expect(
      await fetchGeoLandslideSourceAction([141.32, 43.02, 141.34, 43.04], {
        generatedAt: manifest.generatedAt,
      })
    ).toEqual({ status: 'error' });
  });
});
