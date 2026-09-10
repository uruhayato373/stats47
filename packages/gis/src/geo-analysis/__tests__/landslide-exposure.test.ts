import { describe, it, expect } from 'vitest';
import { LANDSLIDE_EXPOSURE_SOURCE as S } from '../../../../data-configs/src/theme-catalog/landslide-exposure-source';
import {
  landslideCounts,
  parseGeoLandslidePrefDetail,
  assertLandslideSourcePublication,
  landslideValues,
  assertGeoLandslideConservation,
  expectedLandslideInputs,
} from '../landslide-exposure';
const clone = <T>(x: T): T => JSON.parse(JSON.stringify(x));
const p = S.populationSources.find((p) => p.areaCode === '47000')!;
function available() {
  const meshes: Array<[number, number, number, number, number, number]> = [];
  for (let i = 0; i < p.populatedRecords; i++) {
    let v = i;
    const q2 = (v % 4) + 1;
    v = Math.floor(v / 4);
    const q1 = (v % 4) + 1;
    v = Math.floor(v / 4);
    const c = v % 10;
    v = Math.floor(v / 10);
    const r = v % 10;
    v = Math.floor(v / 10);
    const c2 = v % 8,
      r2 = Math.floor(v / 8) % 8;
    meshes.push([
      Number(`3927${r2}${c2}${r}${c}${q1}${q2}`),
      47001,
      i === 0 ? p.populationScaled - p.populatedRecords + 1 : 1,
      i === 0 ? 9 : 0,
      i === 0 ? 9 : 0,
      i === 0 ? 9 : 0,
    ]);
  }
  const empty = landslideCounts([]),
    summary = {
      ...landslideCounts(meshes.map((m) => [m[2], m[3], m[4], m[5]])),
      zeroRecords: p.zeroRecords,
      rawRecords: p.populatedRecords + p.zeroRecords,
      crossSourcePrefectureRecords: 0,
      facilities: { administrative: empty, meeting: empty },
    };
  return {
    schemaVersion: 1,
    slug: S.slug,
    dataVersion: S.dataVersion,
    generatedAt: '2026-09-11T00:00:00.000Z',
    areaCode: p.areaCode,
    areaName: p.areaName,
    status: 'available',
    populationScale: 10000,
    meshes,
    facilities: [],
    summary,
  };
}
function excluded() {
  return {
    schemaVersion: 1,
    slug: S.slug,
    dataVersion: S.dataVersion,
    generatedAt: '2026-09-11T00:00:00.000Z',
    areaCode: '26000',
    areaName: '京都府',
    status: 'excluded-commercial-restriction',
    reason: 'A33-25 商用利用不可',
    meshes: [],
    facilities: [],
    summary: null,
  };
}
describe('landslide exclusive counts', () => {
  it('unions warning and special without doubling population', () => {
    const s = landslideCounts([
      [100, 9, 9, 9],
      [20, 1, 0, 1],
      [30, 0, 0, 1],
    ]);
    expect(s.exclusiveScaled).toEqual([30, 20, 100]);
    expect(s.totalScaled).toBe(150);
    expect(s.warningScaled).toBe(120);
    expect(s.specialScaled).toBe(100);
  });
  it('retains red outside yellow rather than assuming nesting', () =>
    expect(landslideCounts([[3, 8, 0, 8]]).redOutsideWarningScaled).toBe(3));
  it('phenomena are overlapping, not additive categories', () => {
    const s = landslideCounts([[10, 3, 3, 3]]);
    expect(s.phenomenonScaled).toEqual([10, 10, 0]);
    expect(s.exclusiveScaled).toEqual([0, 10, 0]);
  });
  it('uses the exact denominator rather than prefecture means', () => {
    const s = available().summary;
    const v = landslideValues(s);
    expect(v.exposedCenterPopulationShare).toBe(
      (Number(v.exposedCenterPopulation) / Number(v.population2020)) * 100
    );
  });
});
describe('source and unavailable contract', () => {
  it('keeps all 47 statuses but no Kyoto A33 input', () => {
    const inputs = expectedLandslideInputs();
    expect(inputs).toHaveLength(140);
    expect(inputs.some((p) => p.key === 'gis/mlit-ksj/A33/25/26.zip')).toBe(
      false
    );
  });
  it('approves only the exact allowed archive', () => {
    const p = S.prefectures[0];
    expect(() =>
      assertLandslideSourcePublication('01', p.sha256, S.a33.permissions.sha256)
    ).not.toThrow();
  });
  for (const [name, pref, sha, permission] of [
    ['Kyoto', '26', '0'.repeat(64), S.a33.permissions.sha256],
    ['changed source', '01', '0'.repeat(64), S.a33.permissions.sha256],
    ['changed permission', '01', S.prefectures[0].sha256, '0'.repeat(64)],
  ] as const)
    it(`rejects ${name}`, () =>
      expect(() =>
        assertLandslideSourcePublication(pref, sha, permission)
      ).toThrow());
  it('preserves unavailable Kyoto as null', () =>
    expect(
      parseGeoLandslidePrefDetail(excluded(), '26000')?.summary
    ).toBeNull());
  it('rejects Kyoto zero values', () => {
    const v = excluded();
    Object.assign(v, { summary: landslideCounts([]) });
    expect(parseGeoLandslidePrefDetail(v, '26000')).toBeNull();
  });
  it('rejects Kyoto renamed to another province', () =>
    expect(
      parseGeoLandslidePrefDetail(
        { ...excluded(), areaName: '大阪府' },
        '26000'
      )
    ).toBeNull());
});
describe('detail invariants', () => {
  const valid = available();
  it('accepts an explicitly synthetic set with pinned population denominator', () =>
    expect(parseGeoLandslidePrefDetail(valid, '47000')).not.toBeNull());
  const mutations: Record<string, (v: ReturnType<typeof available>) => void> = {
    'wrong prefecture name': (v) => {
      v.areaName = '東京都' as typeof v.areaName;
    },
    'wrong source version': (v) => {
      v.dataVersion = 'old' as typeof v.dataVersion;
    },
    'duplicate composite mesh identity': (v) => {
      v.meshes[1] = v.meshes[0]!;
    },
    'foreign municipality': (v) => {
      v.meshes[0]![1] = 13001;
    },
    'invalid quadrant': (v) => {
      v.meshes[0]![0] = 3927000000;
    },
    'pre-designation mistaken for an extra mask': (v) => {
      v.meshes[0]![3] = 64;
    },
    'lower bound outside center': (v) => {
      v.meshes[1]![4] = 1;
    },
    'center outside upper bound': (v) => {
      v.meshes[0]![5] = 0;
    },
    'changed denominator': (v) => {
      v.summary.totalScaled++;
    },
    'double counted population': (v) => {
      v.summary.exclusiveScaled[2]++;
    },
    'missing record': (v) => {
      v.meshes.pop();
    },
    'unannounced field': (v) => {
      Object.assign(v, { rankSafe: true });
    },
  };
  for (const [name, mutate] of Object.entries(mutations))
    it(`rejects ${name}`, () => {
      const v = clone(valid);
      mutate(v);
      expect(parseGeoLandslidePrefDetail(v, '47000')).toBeNull();
    });
  it('rejects a changed aggregate on conservation comparison', () => {
    const d = parseGeoLandslidePrefDetail(valid, '47000')!;
    const r = {
      areaCode: d.areaCode,
      areaName: d.areaName,
      rank: 1,
      values: landslideValues(d.summary),
    };
    r.values.exposedCenterPopulation = 0;
    expect(() => assertGeoLandslideConservation(d, r)).toThrow();
  });
});
