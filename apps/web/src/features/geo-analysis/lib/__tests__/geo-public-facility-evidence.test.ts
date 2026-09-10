import { validatePublicFacilityDetail } from '@stats47/gis';
import { describe, expect, it } from 'vitest';

import { buildGeoPublicFacilityMapModel } from '../build-geo-public-facility-map-model';
import { GEO_CROSS_ANALYSIS_SLUGS } from '../geo-cross-analysis';
import {
  parseGeoPublicFacilityPrefDetail,
  publicFacilityNationalValues,
  validPublicFacilityRows,
} from '../geo-public-facility-evidence';
import { isGeoSpatialView } from '../geo-spatial-evidence';

import {
  PUBLIC_FACILITY_SLUG,
  publicFacilityBundleFixture,
  publicFacilityDetailFixture,
} from './geo-public-facility-fixture';

const fixture = publicFacilityBundleFixture();
// JSON mutations deliberately model untrusted wire payloads, not authored typed objects.
const copyRows = () => JSON.parse(JSON.stringify(fixture.snapshot.rows));

describe('公共施設UIの独立した2群・人口分母・原値契約', () => {
  it('47県・5帯・2群・2年の値を受け付ける', () => {
    expect(validPublicFacilityRows(fixture.snapshot.rows)).toBe(true);
  });
  it('1帯の欠落を0で埋めない', () => {
    const rows = copyRows();
    delete rows[0].values.administrativeBand0Population2020;
    expect(validPublicFacilityRows(rows)).toBe(false);
  });
  it('分母と一致しない比率を拒否する', () => {
    const rows = copyRows();
    rows[0].values.administrativeBand0Share2020 += 1;
    expect(validPublicFacilityRows(rows)).toBe(false);
  });
  it('行政・集会施設の人口を足した二重計上を拒否する', () => {
    const rows = copyRows();
    rows[0].values.population2020 *= 2;
    expect(validPublicFacilityRows(rows)).toBe(false);
  });
  it('人口0の比率nullを0%と区別する', () => {
    const rows = copyRows();
    rows[0].values.population2020 = 0;
    for (const group of ['administrative', 'meeting']) {
      for (let band = 0; band < 5; band++) {
        rows[0].values[`${group}Band${band}Population2020`] = 0;
        rows[0].values[`${group}Band${band}Share2020`] = null;
      }
      rows[0].values[`${group}Within1000mPopulation2020`] = 0;
      rows[0].values[`${group}Within1000mShare2020`] = null;
    }
    expect(validPublicFacilityRows(rows)).toBe(true);
    rows[0].values.meetingBand0Share2020 = 0;
    expect(validPublicFacilityRows(rows)).toBe(false);
  });
  it('全国は人口を1回だけ合計し県比率の単純平均を使わない', () => {
    const national = publicFacilityNationalValues(fixture.snapshot.rows);
    const population = 100 * ((47 * 48) / 2);
    expect(national.population2020).toBe(population);
    for (const group of ['administrative', 'meeting']) {
      const sums = Array.from({ length: 5 }, (_, band) =>
        fixture.details.reduce(
          (sum, detail) =>
            sum +
            detail.summary[group as 'administrative' | 'meeting'][band]!
              .population2020,
          0
        )
      );
      expect(sums.reduce((a, b) => a + b, 0)).toBe(population);
      sums.forEach((sum, band) => {
        expect(national[`${group}Band${band}Population2020`]).toBe(sum);
        expect(national[`${group}Band${band}Share2020`]).toBeCloseTo(
          (sum / population) * 100,
          12
        );
      });
    }
    const mean =
      fixture.snapshot.rows.reduce(
        (sum, row) => sum + Number(row.values.administrativeBand0Share2020),
        0
      ) / 47;
    expect(national.administrativeBand0Share2020).not.toBeCloseTo(mean, 6);
  });
  it('94地図モデルは2群の原典全施設・県外最寄り・人口・距離を保持する', () => {
    for (const detail of fixture.details)
      for (const group of ['administrative', 'meeting'] as const) {
        const model = buildGeoPublicFacilityMapModel(detail, group);
        const offset = group === 'administrative' ? 5 : 8;
        expect(model.sourceFacilities).toHaveLength(
          group === 'administrative' ? 2 : 1
        );
        expect(model.nearestFacilities).toHaveLength(1);
        expect(model.collection.features[0]!.properties).toMatchObject({
          population2020: detail.meshes[0]![3],
          population2050: detail.meshes[0]![4],
          distanceMeters: detail.meshes[0]![offset + 1],
          band: detail.meshes[0]![offset + 2],
          facilityId: model.nearestFacilities[0]![1],
          outsidePrefecture:
            group === 'administrative' &&
            Number(detail.areaCode.slice(0, 2)) % 2 === 0,
        });
      }
  });
  it('47県詳細は実GIS validatorとWeb parserを通る', () => {
    for (const detail of fixture.details) {
      expect(() => validatePublicFacilityDetail(detail)).not.toThrow();
      expect(parseGeoPublicFacilityPrefDetail(detail, detail.areaCode)).toEqual(
        detail
      );
    }
  });
  it('距離・帯・保存則・重複・県・slugの改変を拒否する', () => {
    const base = publicFacilityDetailFixture('28');
    const corruptions = [
      { ...base, slug: 'population-station-access' },
      { ...base, areaCode: '27000' },
      {
        ...base,
        meshes: base.meshes.map((m) =>
          m.map((v, i) => (i === 6 ? Number(v) + 10 : v))
        ),
      },
      {
        ...base,
        meshes: base.meshes.map((m) => m.map((v, i) => (i === 7 ? 4 : v))),
      },
      {
        ...base,
        summary: {
          ...base.summary,
          administrative: base.summary.administrative.map((b, i) =>
            i === 0 ? { ...b, population2020: b.population2020 + 1 } : b
          ),
        },
      },
      { ...base, meshes: [...base.meshes, base.meshes[0]] },
      { ...base, facilities: [...base.facilities, base.facilities[0]] },
    ];
    corruptions.forEach((value) =>
      expect(parseGeoPublicFacilityPrefDetail(value, '28000')).toBeNull()
    );
  });
  it('施設原典を扱う2分析だけにfacilities表示を許し、既存3分析の3表示を維持する', () => {
    for (const slug of GEO_CROSS_ANALYSIS_SLUGS) {
      expect(isGeoSpatialView('facilities', slug)).toBe(
        slug === PUBLIC_FACILITY_SLUG || slug === 'population-landslide-exposure'
      );
      for (const view of ['population', 'overlap', 'audit'])
        expect(isGeoSpatialView(view, slug)).toBe(true);
      expect(isGeoSpatialView('invalid', slug)).toBe(false);
    }
    expect(isGeoSpatialView('facilities', 'not-a-geo-analysis')).toBe(false);
  });
});
