import { describe, it, expect } from 'vitest';

import { parseBridgeInspectionAgeSnapshot } from '../lib/bridge-inspection-age-snapshot';

import { bridgeInspectionAgeFixture } from './bridge-inspection-age-fixture';

const mutate = (
  change: (x: ReturnType<typeof bridgeInspectionAgeFixture>) => void
) => {
  const x = bridgeInspectionAgeFixture();
  change(x);
  return x;
};
describe('当年度点検橋の分母・架設年度・原典契約', () => {
  it('47県と全国の既知/不明・管理者別掲載数を保存する', () => {
    const x = parseBridgeInspectionAgeSnapshot(bridgeInspectionAgeFixture());
    expect(x.areas).toHaveLength(47);
    expect(x.national.publishedCount).toBe(153326);
    expect(x.national.unknownYearCount).toBe(39158);
    expect(x.areas[30]!.managerCounts.highway).toBe(0);
  });
  it.each([
    [
      'missing-pref',
      (x: ReturnType<typeof bridgeInspectionAgeFixture>) => x.areas.pop(),
    ],
    ['duplicate-pref', (x) => (x.areas[1] = structuredClone(x.areas[0]!))],
    ['swapped-pref-name', (x) => (x.areas[0]!.areaName = '東京都')],
    ['wrong-source-sha', (x) => (x.sources[0]!.sha256 = '0'.repeat(64))],
    ['wrong-source-url', (x) => (x.sources[0]!.url += '?different')],
    [
      'duplicate-source',
      (x) => (x.sources[1] = structuredClone(x.sources[0]!)),
    ],
    ['all-managed-denominator', (x) => (x.national.publishedCount = 730788)],
    ['unknown-dropped', (x) => (x.areas[0]!.unknownYearCount = 0)],
    [
      'wrong-band-boundary',
      (x) => (x.areas[0]!.cohorts[0]!.constructionFiscalYear = 1974),
    ],
    [
      'cohort-into-wrong-band',
      (x) => (x.areas[0]!.cohorts[0]!.constructionFiscalYear = 1977),
    ],
    [
      'duplicate-cohort',
      (x) => (x.areas[0]!.cohorts[1]!.constructionFiscalYear = 1975),
    ],
    [
      'future-construction',
      (x) => (x.areas[0]!.cohorts[0]!.constructionFiscalYear = 2026),
    ],
    [
      'unknown-as-zero-year',
      (x) =>
        x.areas[0]!.cohorts.push({ constructionFiscalYear: 0, count: 39112 }),
    ],
    ['negative-count', (x) => (x.areas[0]!.bands[0]!.count = -1)],
    ['fractional-count', (x) => (x.areas[0]!.bands[0]!.count = 0.5)],
    ['missing-band', (x) => x.areas[0]!.bands.pop()],
    [
      'duplicate-band',
      (x) => (x.areas[0]!.bands[0] = structuredClone(x.areas[0]!.bands[1]!)),
    ],
    ['wrong-manager', (x) => (x.areas[0]!.managerCounts.highway += 1)],
    ['missing-known-cohort', (x) => x.areas[0]!.cohorts.pop()],
    ['national-not-pooled', (x) => (x.national.cohorts[0]!.count += 1)],
  ] as Array<
    [string, (x: ReturnType<typeof bridgeInspectionAgeFixture>) => void]
  >)('rejects %s', (_name, change) => {
    expect(() => parseBridgeInspectionAgeSnapshot(mutate(change))).toThrow();
  });
  it.each([
    { year: '2024' },
    { asOf: '2025-12-31' },
    { unit: '件' },
    { profileKey: 'all-bridge-age' },
    { generatedAt: 'not-a-date' },
    {
      definition: {
        ...bridgeInspectionAgeFixture().definition,
        ageMethod: 'elapsed-years',
      },
    },
    {
      definition: {
        ...bridgeInspectionAgeFixture().definition,
        unknownYear: 'drop',
      },
    },
    {
      definition: {
        ...bridgeInspectionAgeFixture().definition,
        population: 'all-managed',
      },
    },
  ])('rejects changed definition %j', (change) =>
    expect(() =>
      parseBridgeInspectionAgeSnapshot({
        ...bridgeInspectionAgeFixture(),
        ...change,
      })
    ).toThrow()
  );
});
