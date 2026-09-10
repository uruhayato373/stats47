import { fetchPrefectures } from '@stats47/area';
import { BRIDGE_INSPECTION_AGE_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';

import type {
  BridgeInspectionAgeSnapshot,
  BridgeInspectionAgeDistribution,
} from '../lib/bridge-inspection-age-snapshot';

/** Synthetic counts preserve the pinned population; these are not reported prefecture values. */
export function bridgeInspectionAgeFixture(): BridgeInspectionAgeSnapshot {
  const make = (
    older: number,
    newer: number,
    unknown: number,
    managers: BridgeInspectionAgeDistribution['managerCounts']
  ): BridgeInspectionAgeDistribution => ({
    publishedCount: older + newer + unknown,
    knownYearCount: older + newer,
    unknownYearCount: unknown,
    bands: SOURCE.bands.map((b) => ({
      key: b.key,
      count:
        b.key === '50-plus'
          ? older
          : b.key === '40-49'
            ? newer
            : b.key === 'unknown'
              ? unknown
              : 0,
    })),
    cohorts: [
      { constructionFiscalYear: 1975, count: older },
      { constructionFiscalYear: 1976, count: newer },
    ],
    managerCounts: managers,
  });
  const areas = fetchPrefectures().map((p, i) => ({
    areaCode: p.prefCode,
    areaName: p.prefName,
    ...make(
      i === 0 ? 50000 : 1,
      i === 0 ? 64076 : 1,
      i === 0 ? 39112 : 1,
      i === 0
        ? { mlit: 8314, highway: 4990, local: 139884 }
        : { mlit: 0, highway: 0, local: 3 }
    ),
  }));
  return {
    schemaVersion: 1,
    profileKey: SOURCE.profileKey,
    generatedAt: '2026-09-11T00:00:00.000Z',
    year: SOURCE.year,
    asOf: SOURCE.asOf,
    unit: SOURCE.unit,
    definition: { ...SOURCE.definition },
    sources: SOURCE.sources.map((s) => ({
      id: s.id,
      url: s.url,
      sha256: s.sha256,
    })),
    areas,
    national: make(50046, 64122, 39158, {
      mlit: 8314,
      highway: 4990,
      local: 140022,
    }),
  };
}
