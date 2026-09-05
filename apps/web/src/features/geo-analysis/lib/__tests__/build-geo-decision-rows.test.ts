import { describe, expect, it } from 'vitest';

import { buildGeoDecisionRows } from '../build-geo-decision-rows';

import type { GeoAnalysisSnapshot } from '../geo-cross-analysis';

function snapshot(
  slug: string,
  values: (index: number) => Record<string, number>,
): GeoAnalysisSnapshot {
  return {
    schemaVersion: 1,
    slug,
    generatedAt: '2026-08-29T00:00:00.000Z',
    dataVersion: '2020-2050',
    geography: 'prefecture',
    title: slug,
    question: slug,
    primaryMetricKey: Object.keys(values(1))[0] ?? '',
    metrics: [],
    rows: Array.from({ length: 47 }, (_, index) => ({
      areaCode: `${String(index + 1).padStart(2, '0')}000`,
      areaName: `県${index + 1}`,
      rank: index + 1,
      values: values(index + 1),
    })),
    summary: {
      observationCount: 47,
      medianValue: 0,
      topAreaCodes: [],
      bottomAreaCodes: [],
    },
    method: [],
    sources: [],
    caveats: [],
    dataQuality: {
      expectedAreas: 47,
      actualAreas: 47,
      missingAreaCodes: [],
      inputCounts: {},
      coverageNote: '47件',
    },
  };
}

const landPrice = () =>
  snapshot('population-land-price', (index) => ({
    population2050: 1_000_000 + index,
    populationChangeRate: -index,
    medianLandPriceChange: index / 10,
    medianResidentialLandPrice: 50_000 + index,
    risingDecliningPointShare: 25,
    comparablePointCount: 100,
  }));
const floodRisk = () =>
  snapshot('population-flood-risk', (index) => ({
    exposedPopulation2050: 10_000 + index,
    floodExposureShare2050: index / 2,
  }));
const stationAccess = () =>
  snapshot('population-station-access', (index) => ({
    accessiblePopulation2050: 20_000 + index,
    stationAccessShare2050: index,
  }));

describe('buildGeoDecisionRows', () => {
  it('同じ都道府県コードの4つの問いを47件に結合する', () => {
    const rows = buildGeoDecisionRows(
      landPrice(),
      floodRisk(),
      stationAccess(),
    );

    expect(rows).toHaveLength(47);
    expect(rows[0]).toEqual({
      areaCode: '01000',
      areaName: '県1',
      population2050: 1_000_001,
      populationChangeRate: -1,
      landPriceChange: 0.1,
      medianResidentialLandPrice: 50_001,
      risingDecliningPointShare: 25,
      comparablePointCount: 100,
      floodExposurePopulation: 10_001,
      floodExposureShare: 0.5,
      stationAccessPopulation: 20_001,
      stationAccessShare: 1,
    });
  });

  it('1県でも欠損すると横断結果を公開しない', () => {
    const incomplete = floodRisk();
    const rows = buildGeoDecisionRows(
      landPrice(),
      { ...incomplete, rows: incomplete.rows.slice(1) },
      stationAccess(),
    );

    expect(rows).toEqual([]);
  });
});
