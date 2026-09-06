import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

import { assertUnchangedRetentionInventory, LICENSE_RETENTION_TARGETS } from '../license-retention';

const expected = [{ key: 'app/stats/dam-count/values.json', bytes: 12, etag: 'original' }];

describe('approved license remediation deletion boundary', () => {
  it('accepts exactly the preserved key, wire bytes and ETag', () => {
    expect(() => assertUnchangedRetentionInventory(expected, [...expected])).not.toThrow();
  });
  it.each([
    [],
    [...expected, { key: 'app/stats/other/values.json', bytes: 1, etag: 'new' }],
    [{ ...expected[0], bytes: 13 }],
    [{ ...expected[0], etag: 'concurrent-replacement' }],
    [{ ...expected[0], key: 'app/stats/other/values.json' }],
    [expected[0], expected[0]],
  ])('rejects missing, added, changed or duplicate objects before any deletion', (...objects) => {
    expect(() => assertUnchangedRetentionInventory(expected, objects)).toThrow();
  });
  it('pins the approved raw, retired rankings, obsolete sidecars and three blogs only', () => {
    expect(LICENSE_RETENTION_TARGETS.map((target) => target.objects.length)).toEqual([435, 125, 2, 53, 1, 3]);
    expect(LICENSE_RETENTION_TARGETS.map((target) => target.objects.reduce((sum, object) => sum + object.bytes, 0)))
      .toEqual([48973241, 2111153, 19632, 2408761, 9100, 21052]);
    const rawIds = new Set(LICENSE_RETENTION_TARGETS[0].objects.map((object) => object.key.split('/')[2]));
    expect([...rawIds].sort()).toEqual(['C02', 'C09', 'C23', 'P03', 'P12', 'P13', 'P17', 'P18', 'P35', 'W01', 'W05']);
    const retired = ['dam-count', 'hydroelectric-power-plant-count', 'thermal-power-plant-count',
      'nuclear-power-plant-count', 'geothermal-power-plant-count', 'wind-power-plant-count-facility',
      'biomass-power-station-count', 'tourism-resource-count', 'fishing-port-count'];
    for (const object of LICENSE_RETENTION_TARGETS[1].objects) {
      expect(retired.some((key) => object.key.startsWith(`app/stats/${key}/`) ||
        object.key.startsWith(`app/ranking/${key}/`) || object.key === `app/correlation/by-ranking-key/${key}.json`)).toBe(true);
    }
    expect(LICENSE_RETENTION_TARGETS[2].objects.map((object) => object.key).sort()).toEqual([
      'app/ranking/fishing-port-count-ksj/values-per-household.json',
      'app/ranking/roadside-station-count/values-per-household.json',
    ]);
    expect(LICENSE_RETENTION_TARGETS[3].prefixes).toEqual([
      'app/blog/airport-count-vs-wind-power-plant-count-facility/',
      'app/blog/dam-count-prefecture-gap/',
      'app/blog/dam-count-vs-road-expressway-length/',
    ]);
    expect(LICENSE_RETENTION_TARGETS[4].prefixes).toEqual([
      'app/ranking/port-count/values-per-household.json',
    ]);
    expect(LICENSE_RETENTION_TARGETS[5].prefixes).toEqual([
      'app/blog/roadside-station-count-prefecture-gap/article.prompt.txt',
      'app/blog/roadside-station-count-vs-forest-road-length/article.prompt.txt',
      'app/blog/roadside-station-prefecture-gap/data/values.json',
    ]);
    for (const target of LICENSE_RETENTION_TARGETS) {
      expect(new Set(target.objects.map((object) => object.key)).size).toBe(target.objects.length);
      for (const object of target.objects) {
        expect(target.prefixes.some((prefix) => prefix.endsWith('/') ? object.key.startsWith(prefix) : object.key === prefix)).toBe(true);
      }
    }
  });
  it('checks out the dispatch revision rather than unrelated develop changes', () => {
    const workflow = readFileSync(path.resolve(__dirname, '../../../../../../.github/workflows/r2-maintenance.yml'), 'utf8');
    expect(workflow).toContain('ref: ${{ github.sha }}');
    expect(workflow).not.toContain('ref: develop');
  });
});
