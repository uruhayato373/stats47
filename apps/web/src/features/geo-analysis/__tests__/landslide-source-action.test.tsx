import fs from 'node:fs';
import path from 'node:path';

import { beforeEach, describe, it, expect, vi } from 'vitest';

const mock = vi.hoisted(() => ({ fetch: vi.fn() }));
vi.mock('@stats47/r2-storage/server', () => ({
  fetchFromR2AsJson: mock.fetch,
}));
import { fetchGeoLandslideSourceAction } from '../actions/fetch-landslide-source';
const root = process.env.LANDSLIDE_CANONICAL_ROOT ?? path.resolve('.local/r2'),
  key = 'app/geo/population-landslide-exposure/manifest.json',
  exists = fs.existsSync(path.join(root, key)),
  read = (k: string) => JSON.parse(fs.readFileSync(path.join(root, k), 'utf8')),
  manifest = exists ? read(key) : null;
describe.skipIf(!exists)('landslide source viewport loader', () => {
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
