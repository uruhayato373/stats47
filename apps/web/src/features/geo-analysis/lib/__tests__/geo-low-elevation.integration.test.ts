import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));
import { buildGeoLowElevationMapModel, lowElevationTooltip } from '../build-geo-low-elevation-map-model';
import { GEO_CROSS_ANALYSIS_CONFIGS, isGeoCrossAnalysisSlug } from '../geo-cross-analysis';
import { spatialAuditRows } from '../geo-spatial-evidence';
import {
  loadGeoAnalysisPrefBundle,
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';
import {
  loadGeoAnalysisBundle,
  parseGeoAnalysisSnapshot,
} from '../load-geo-analysis-snapshot';

import {
  LOW_ELEVATION_SLUG as slug,
  lowElevationBundleFixture,
} from './geo-low-elevation-fixture';

// 実artifactで確認するときは GEO_ARTIFACT_ROOT=../../.local/r2/app/geo。未指定なら合成fixtureで同じ契約を実行する。
const root = process.env.GEO_ARTIFACT_ROOT;
const fixture = lowElevationBundleFixture();
const prefix = `app/geo/${slug}/`;
function read(key: string): any {
  if (root !== undefined)
    return JSON.parse(readFileSync(resolve(root, slug, `${key}.json`), 'utf8'));
  if (!fixture.objects.has(key)) throw new Error(`Missing fixture: ${key}`);
  return structuredClone(fixture.objects.get(key));
}
function mockObjects(overrides = new Map<string, unknown>()) {
  vi.mocked(fetchFromR2AsJson).mockImplementation(async (key) => {
    if (!key.startsWith(prefix) || !key.endsWith('.json'))
      throw new Error(`Unexpected artifact key: ${key}`);
    const short = key.slice(prefix.length, -5);
    return overrides.has(short) ? structuredClone(overrides.get(short)) : read(short);
  });
}

describe(`標高の低い土地に住む人口の配信契約 (${root ? '実artifact' : '合成fixture'})`, () => {
  beforeEach(() => {
    vi.mocked(fetchFromR2AsJson).mockReset();
    mockObjects();
  });

  it('分析がGeoの公開slug・設定として登録されている', () => {
    expect(isGeoCrossAnalysisSlug(slug)).toBe(true);
    const config = GEO_CROSS_ANALYSIS_CONFIGS[slug];
    expect(config.mapLimit).toContain('2009年5月時点');
    expect(config.takeaways.join('')).toContain('安全と危険の境界としては読みません');
  });

  it('manifest・集計・47県が検証を通り、loader経由でも同じ束が得られる', async () => {
    const manifest = parseGeoAnalysisManifest(read('manifest'), slug);
    expect(manifest).not.toBeNull();
    const snapshot = parseGeoAnalysisSnapshot(read('item'), slug);
    expect(snapshot?.rows).toHaveLength(47);
    expect(snapshot?.primaryMetricKey).toBe('lowElevationShareMean5m');
    const bundle = await loadGeoAnalysisBundle(slug);
    expect(bundle?.manifest.generatedAt).toBe(snapshot?.generatedAt);
    for (let i = 1; i <= 47; i++) {
      const pref = String(i).padStart(2, '0');
      const loaded = await loadGeoAnalysisPrefBundle(slug, pref);
      expect(loaded, pref).not.toBeNull();
      expect(parseGeoAnalysisPrefDetail(read(`pref/${pref}`), slug, `${pref}000`)).toEqual(loaded?.detail);
    }
  }, 60_000);

  it('検算の表示行と地図モデルが県詳細の数値から作られる', async () => {
    const detail = (await loadGeoAnalysisPrefBundle(slug, '13'))!.detail;
    if (detail.slug !== slug) throw new Error('slug');
    const rows = spatialAuditRows(detail);
    expect(rows.map((row) => row.label).join('|')).toContain('国勢調査2020の都道府県人口');
    expect(rows[1]!.value).toContain('一致');
    const model = buildGeoLowElevationMapModel(detail);
    expect(model.collection.features).toHaveLength(detail.meshes.length);
    const unknown = model.collection.features.find((f) => f.properties?.meanElevation === null);
    if (unknown) expect(lowElevationTooltip(unknown.properties!)).toContain('標高不明');
  });

  it('入力の欠落・SHA差し替え・stage入れ替え・原典表示の改変を持つmanifestを拒否する', () => {
    const manifest = read('manifest');
    const drop = structuredClone(manifest); drop.inputs.splice(0, 1);
    const swap = structuredClone(manifest); swap.inputs[5].sha256 = '2'.repeat(64);
    const stage = structuredClone(manifest); [stage.stages[2], stage.stages[3]] = [stage.stages[3], stage.stages[2]];
    const attribution = structuredClone(manifest); attribution.attribution.mesh1000r6 = '';
    const census = structuredClone(manifest); census.censusReference.populationByArea['13000'] += 1;
    for (const bad of [drop, swap, stage, attribution, census])
      expect(parseGeoAnalysisManifest(bad, slug), 'mutation must be rejected').toBeNull();
  });

  it('県詳細の改変・版混在・国勢調査人口の不一致・集計行との乖離を拒否する', async () => {
    const detail = read('pref/13');
    const manifest = read('manifest');
    const item = read('item');
    const reject = async (overrides: Record<string, unknown>) => {
      mockObjects(new Map(Object.entries(overrides)));
      return loadGeoAnalysisPrefBundle(slug, '13');
    };
    expect(await reject({})).not.toBeNull();
    expect(await reject({ 'pref/13': { ...detail, areaName: '改変' } })).toBeNull();
    const shifted = structuredClone(detail); shifted.meshes[0][2] += 1;
    expect(await reject({ 'pref/13': shifted })).toBeNull();
    expect(await reject({ manifest: { ...manifest, generatedAt: '2026-01-01T00:00:00.000Z' } })).toBeNull();
    const census = structuredClone(manifest); census.censusReference.populationByArea['13000'] += 1;
    expect(await reject({ manifest: census })).toBeNull();
    const row = structuredClone(item); row.rows.find((r: any) => r.areaCode === '13000').values.lowElevationShareMean5m += 1;
    expect(await reject({ item: row })).toBeNull();
  });
});
