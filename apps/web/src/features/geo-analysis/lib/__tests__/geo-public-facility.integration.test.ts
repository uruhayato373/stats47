import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';


vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));
import { buildGeoPublicFacilityMapModel } from '../build-geo-public-facility-map-model';
import { publicFacilityNationalValues } from '../geo-public-facility-evidence';
import { matchesGeoArtifact } from '../geo-runtime-contract';
import {
  loadGeoAnalysisPrefBundle,
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';
import {
  loadGeoAnalysisBundle,
  parseGeoAnalysisSnapshot,
} from '../load-geo-analysis-snapshot';

import { bindFixtureArtifact } from './geo-manifest-fixture';
import {
  PUBLIC_FACILITY_SLUG as slug,
  publicFacilityBundleFixture,
} from './geo-public-facility-fixture';

import type {
  GeoAnalysisEvidenceManifest,
  GeoAnalysisSnapshot,
} from '@stats47/gis';

const root = process.env.GEO_ARTIFACT_ROOT;
const fixture = publicFacilityBundleFixture();
const prefix = `app/geo/${slug}/`;
// An explicit root never falls back to synthetic inputs when an artifact is missing.
function read(key: string): unknown {
  if (root !== undefined)
    return JSON.parse(readFileSync(resolve(root, slug, `${key}.json`), 'utf8'));
  if (!fixture.objects.has(key)) throw new Error(`Missing fixture: ${key}`);
  return structuredClone(fixture.objects.get(key));
}
function mockObjects(overrides = new Map<string, unknown>()) {
  vi.mocked(fetchFromR2AsJson).mockImplementation(async (key) => {
    if (!key.startsWith(prefix) || !key.endsWith('.json'))
      throw new Error(`Unexpected artifact key: ${key}`);
    const shortKey = key.slice(prefix.length, -5);
    return overrides.has(shortKey)
      ? structuredClone(overrides.get(shortKey))
      : read(shortKey);
  });
}
function manifest(): GeoAnalysisEvidenceManifest {
  const value = parseGeoAnalysisManifest(read('manifest'), slug);
  if (!value) throw new Error('Invalid baseline manifest');
  return value;
}

beforeEach(() => {
  vi.mocked(fetchFromR2AsJson).mockReset();
});
describe(`公共施設 canonical bundle (${root === undefined ? '合成47県' : '実artifact47県'})`, () => {
  it('集計・94入力・4段階・47県詳細・47原典施設の世代/SHA/bytes/保存則が一致する', async () => {
    mockObjects();
    const evidence = manifest();
    expect(evidence.inputs).toHaveLength(94);
    expect(evidence.stages.map((s) => s.id)).toEqual([
      'population-mesh',
      'public-facility-points',
      'nearest-facility-distance',
      'distance-band-population',
    ]);
    const bundle = await loadGeoAnalysisBundle(slug);
    expect(bundle).not.toBeNull();
    expect(bundle?.snapshot.rows).toHaveLength(47);
    const sourceStage = evidence.stages.find(
      (s) => s.id === 'public-facility-points'
    )!;
    const sourceTotals = { administrative: 0, meeting: 0 };
    for (let n = 1; n <= 47; n++) {
      const pref = String(n).padStart(2, '0');
      const detail = parseGeoAnalysisPrefDetail(
        read(`pref/${pref}`),
        slug,
        `${pref}000`
      );
      expect(detail?.slug, `${pref} detail`).toBe(slug);
      const loaded = await loadGeoAnalysisPrefBundle(slug, pref);
      expect(loaded?.detail, `${pref} bundle`).toEqual(detail);
      const sourceEvidence = sourceStage.outputs.find(
        (a) => a.areaCode === `${pref}000`
      )!;
      expect(
        await matchesGeoArtifact(read(`source/${pref}`), sourceEvidence),
        `${pref} source SHA`
      ).toBe(true);
      if (detail?.slug !== slug) throw new Error(`Invalid ${pref}`);
      for (const group of ['administrative', 'meeting'] as const) {
        const model = buildGeoPublicFacilityMapModel(detail, group);
        sourceTotals[group] += model.sourceFacilities.length;
        expect(model.collection.features).toHaveLength(detail.meshes.length);
        const offset = group === 'administrative' ? 5 : 8;
        const byId = new Map(detail.facilities.map((p) => [p[0], p[1]]));
        model.collection.features.forEach((feature, i) => {
          const mesh = detail.meshes[i]!;
          expect(feature.properties).toMatchObject({
            population2020: mesh[3],
            population2050: mesh[4],
            distanceMeters: mesh[offset + 1],
            band: mesh[offset + 2],
            facilityId: byId.get(mesh[offset]),
          });
        });
      }
    }
    const snapshot = bundle!.snapshot;
    const national = publicFacilityNationalValues(snapshot.rows);
    for (const group of ['administrative', 'meeting'] as const) {
      expect(national[`${group}FacilityCount`]).toBe(sourceTotals[group]);
      for (const year of [2020, 2050])
        expect(
          Array.from({ length: 5 }, (_, i) =>
            Number(national[`${group}Band${i}Population${year}`])
          ).reduce((a, b) => a + b, 0)
        ).toBeCloseTo(Number(national[`population${year}`]), 4);
    }
    if (root !== undefined)
      expect(sourceTotals).toEqual({ administrative: 8742, meeting: 70790 });
    expect(vi.mocked(fetchFromR2AsJson)).toHaveBeenCalledTimes(2 + 47 * 4);
  }, 120_000);

  it.each(['manifest', 'pref/28', 'source/28', 'item'])(
    '%sの欠落を拒否する',
    async (key) => {
      mockObjects(new Map([[key, null]]));
      expect(await loadGeoAnalysisPrefBundle(slug, '28')).toBeNull();
    }
  );
  it('原典入力47県の欠落とsource段階の県欠落を拒否する', () => {
    const base = manifest();
    expect(
      parseGeoAnalysisManifest(
        {
          ...base,
          inputs: base.inputs.filter(
            (i) => !i.key.endsWith('/P05/22/28.geojson')
          ),
        },
        slug
      )
    ).toBeNull();
    expect(
      parseGeoAnalysisManifest(
        {
          ...base,
          stages: base.stages.map((s) =>
            s.id === 'public-facility-points'
              ? {
                  ...s,
                  outputs: s.outputs.filter((a) => a.areaCode !== '28000'),
                }
              : s
          ),
        },
        slug
      )
    ).toBeNull();
  });
  it('sourceのSHAを再計算しても県内施設一覧がdetailと違えば拒否する', async () => {
    const source = JSON.parse(JSON.stringify(read('source/28')));
    source.facilities[0][4] += '（改変）';
    const rebound = bindFixtureArtifact(
      manifest(),
      `${prefix}source/28.json`,
      source
    );
    expect(parseGeoAnalysisManifest(rebound, slug)).not.toBeNull();
    expect(
      await matchesGeoArtifact(
        source,
        rebound.stages[1]!.outputs.find((a) => a.areaCode === '28000')!
      )
    ).toBe(true);
    mockObjects(
      new Map<string, unknown>([
        ['source/28', source],
        ['manifest', rebound],
      ])
    );
    expect(await loadGeoAnalysisPrefBundle(slug, '28')).toBeNull();
  });
  it('sourceの県違い・別世代をSHA更新後も拒否する', async () => {
    for (const change of [
      { areaCode: '27000' },
      { generatedAt: '2026-01-01T00:00:00.000Z' },
    ]) {
      const source = {
        ...JSON.parse(JSON.stringify(read('source/28'))),
        ...change,
      };
      const rebound = bindFixtureArtifact(
        manifest(),
        `${prefix}source/28.json`,
        source
      );
      mockObjects(
        new Map<string, unknown>([
          ['source/28', source],
          ['manifest', rebound],
        ])
      );
      expect(await loadGeoAnalysisPrefBundle(slug, '28')).toBeNull();
    }
  });
  it('detailのSHAを再計算しても実座標と違う距離を拒否する', async () => {
    const detail = JSON.parse(JSON.stringify(read('pref/28')));
    detail.meshes[0][6] += 10;
    const rebound = bindFixtureArtifact(
      manifest(),
      `${prefix}pref/28.json`,
      detail
    );
    expect(parseGeoAnalysisManifest(rebound, slug)).not.toBeNull();
    mockObjects(
      new Map<string, unknown>([
        ['pref/28', detail],
        ['manifest', rebound],
      ])
    );
    expect(await loadGeoAnalysisPrefBundle(slug, '28')).toBeNull();
  });
  it('itemのSHAを再計算しても県集計の施設数が原典と違えば拒否する', async () => {
    const snapshot = JSON.parse(JSON.stringify(read('item')));
    snapshot.rows.find(
      (r: GeoAnalysisSnapshot['rows'][number]) => r.areaCode === '28000'
    ).values.administrativeFacilityCount += 1;
    // Snapshot remains individually well-formed; only the bundle conservation gate catches this.
    expect(parseGeoAnalysisSnapshot(snapshot, slug)).not.toBeNull();
    const rebound = bindFixtureArtifact(
      manifest(),
      `${prefix}item.json`,
      snapshot,
      true
    );
    mockObjects(
      new Map<string, unknown>([
        ['item', snapshot],
        ['manifest', rebound],
      ])
    );
    expect(await loadGeoAnalysisPrefBundle(slug, '28')).toBeNull();
  });
});
