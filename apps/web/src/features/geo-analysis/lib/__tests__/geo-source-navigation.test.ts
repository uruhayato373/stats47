import { GIS_DATASETS, getKsjLicensePolicy } from '@stats47/gis/mlit-ksj';
import { describe, expect, it } from 'vitest';

import { getGeoSourceNavigation } from '../geo-source-navigation';

describe('GIS navigation publication coverage', () => {
  it('keeps all 50 eligible sources linked, including maps still being prepared', () => {
    const items = getGeoSourceNavigation({
      schemaVersion: 1,
      generatedAt: '2026-09-08',
      items: [],
    }).flatMap((group) => group.items);
    const eligible = GIS_DATASETS.filter(
      (meta) =>
        getKsjLicensePolicy(meta.license).sourcePublication ===
        'public-r2-eligible'
    );
    expect(items).toHaveLength(50);
    expect(new Set(items.map((item) => item.dataId))).toEqual(
      new Set(eligible.map((meta) => meta.dataId))
    );
    expect(items.map((item) => item.position)).toEqual(
      Array.from({ length: 50 }, (_, i) => i + 1)
    );
    expect(items.every((item) => item.status === 'preparing')).toBe(true);
    expect(items.find((item) => item.dataId === 'A31b')?.href).toBe(
      '/geo/datasets/A31b'
    );
  });
  it('requires the current version to report a map as ready', () => {
    const meta = GIS_DATASETS.find((entry) => entry.dataId === 'P29')!;
    if (!meta.latestVersion) throw new Error('P29 version is required');
    for (const version of [meta.latestVersion, 'outdated']) {
      const catalog = {
        schemaVersion: 1 as const,
        generatedAt: '2026-09-08',
        items: [
          {
            dataId: meta.dataId,
            version,
            sourceUrl: 'https://nlftp.mlit.go.jp/',
            assetCount: 1,
          },
        ],
      };
      const items = getGeoSourceNavigation(catalog).flatMap(
        (group) => group.items
      );
      expect(items.find((item) => item.dataId === meta.dataId)?.status).toBe(
        version === meta.latestVersion ? 'ready' : 'preparing'
      );
    }
  });
  it('does not turn a failed inventory read into preparation status', () => {
    expect(
      getGeoSourceNavigation(null)
        .flatMap((group) => group.items)
        .every((item) => item.status === 'unknown')
    ).toBe(true);
  });
});
