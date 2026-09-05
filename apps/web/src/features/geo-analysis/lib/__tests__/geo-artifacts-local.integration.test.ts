import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { describe, expect, it, vi } from 'vitest';

vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));
import { GEO_CROSS_ANALYSIS_SLUGS } from '../geo-cross-analysis';
import { matchesGeoArtifact } from '../geo-runtime-contract';
import {
  parseGeoAnalysisManifest,
  parseGeoAnalysisPrefDetail,
  loadGeoAnalysisPrefDetail,
} from '../load-geo-analysis-evidence';
import {
  parseGeoAnalysisSnapshot,
  loadGeoAnalysisSnapshot,
} from '../load-geo-analysis-snapshot';
import {
  loadGeoStationAccessManifest,
  loadGeoStationAccessPrefDetail,
} from '../load-geo-station-access-evidence';

import { geoArtifactBundleFixture } from './geo-artifact-bundle-fixture';

// CIは合成fixtureで全契約を実行する。実artifact監査はnpm run audit:geo-runtime。
// 明示されたrootの欠落・破損は必ず失敗し、fixtureへフォールバックしない。
const root = process.env.GEO_ARTIFACT_ROOT;
describe(`Geo配信契約 (${root ? '実artifact・141県詳細' : '合成fixture・141県詳細'})`, () => {
  for (const slug of GEO_CROSS_ANALYSIS_SLUGS) {
    const fixtures = geoArtifactBundleFixture(slug);
    const read = (key: string) => {
      if (root !== undefined)
        return JSON.parse(
          readFileSync(resolve(root, slug, `${key}.json`), 'utf8')
        );
      if (!fixtures.has(key))
        throw new Error(`Missing fixture: ${slug}/${key}`);
      return structuredClone(fixtures.get(key));
    };
    it(`${slug}: manifest・集計・47県の再計算値と正準JSON SHA/bytesが有効`, async () => {
      const manifest = parseGeoAnalysisManifest(read('manifest'), slug);
      vi.mocked(fetchFromR2AsJson).mockImplementation(async (key) => {
        const prefix = `app/geo/${slug}/`;
        if (!key.startsWith(prefix) || !key.endsWith('.json'))
          throw new Error(`Unexpected artifact key: ${key}`);
        return read(key.slice(prefix.length, -5));
      });
      expect(manifest).not.toBeNull();
      if (!manifest) throw new Error(`${slug}: invalid manifest`);
      const snapshot = parseGeoAnalysisSnapshot(read('item'), slug);
      expect(snapshot).not.toBeNull();
      expect(await loadGeoAnalysisSnapshot(slug)).toEqual(snapshot);
      expect(snapshot?.generatedAt).toBe(manifest.generatedAt);
      expect(await matchesGeoArtifact(snapshot, manifest.aggregate, true)).toBe(
        true
      );
      for (let i = 1; i <= 47; i++) {
        const pref = String(i).padStart(2, '0');
        const detail = parseGeoAnalysisPrefDetail(
          read(`pref/${pref}`),
          slug,
          `${pref}000`
        );
        expect(detail, `${slug}/${pref}`).not.toBeNull();
        expect(
          await loadGeoAnalysisPrefDetail(slug, pref),
          `${slug}/${pref} loader`
        ).toEqual(detail);
        expect(detail?.generatedAt).toBe(manifest.generatedAt);
        const evidence = manifest.stages[0]!.outputs.find(
          (output) => output.areaCode === `${pref}000`
        )!;
        expect(
          await matchesGeoArtifact(detail, evidence),
          `${slug}/${pref} SHA`
        ).toBe(true);
      }
    }, 60_000);
    it(`${slug}: detailの版混在・内容改変を拒否（駅旧入口も共通gate）`, async () => {
      const detail = read('pref/13');
      const manifest = read('manifest');
      const fetchMock = vi.mocked(fetchFromR2AsJson);
      for (const candidate of [
        null,
        { ...manifest, generatedAt: '2026-01-01T00:00:00Z' },
      ]) {
        fetchMock
          .mockResolvedValueOnce(detail)
          .mockResolvedValueOnce(candidate);
        expect(await loadGeoAnalysisPrefDetail(slug, '13')).toBeNull();
      }
      fetchMock
        .mockResolvedValueOnce({ ...detail, areaName: '改変' })
        .mockResolvedValueOnce(manifest);
      expect(await loadGeoAnalysisPrefDetail(slug, '13')).toBeNull();
      if (slug === 'population-station-access') {
        fetchMock.mockResolvedValueOnce(detail).mockResolvedValueOnce(null);
        expect(await loadGeoStationAccessPrefDetail('13')).toBeNull();
        fetchMock.mockResolvedValueOnce({ ...manifest, inputs: [] });
        expect(await loadGeoStationAccessManifest()).toBeNull();
      }
    });
  }
});
