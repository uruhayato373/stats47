import { createHash } from 'node:crypto';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { beforeEach, expect, it, vi } from 'vitest';

import { manifestFixture } from '../../lib/__tests__/geo-manifest-fixture';
import { loadGeoAnalysisManifest } from '../../lib/load-geo-analysis-evidence';
import { fetchGeoSnowSourceAction } from '../fetch-snow-source';

import type { GeoAnalysisEvidenceManifest } from '@stats47/gis';

vi.mock('@stats47/r2-storage/server', () => ({ fetchFromR2AsJson: vi.fn() }));
vi.mock('../../lib/load-geo-analysis-evidence', () => ({
  loadGeoAnalysisManifest: vi.fn(),
}));
const generatedAt = '2026-09-11T00:00:00.000Z';
function fixture(features: unknown[] = []) {
  const source = {
    type: 'FeatureCollection',
    slug: 'population-snow-designation',
    areaCode: '13000',
    generatedAt,
    displayOnly: true,
    features,
  };
  const body = JSON.stringify(source) + '\n';
  const artifact = {
    key: 'app/geo/population-snow-designation/source/13.json',
    areaCode: '13000',
    sha256: createHash('sha256').update(body).digest('hex'),
    bytes: Buffer.byteLength(body),
    recordCount: features.length,
  };
  // Manifest validation itself is covered by the 47-prefecture source contract tests.
  const base = manifestFixture('population-flood-risk');
  const manifest: GeoAnalysisEvidenceManifest = {
    ...base,
    slug: 'population-snow-designation',
    generatedAt,
    stages: [{ ...base.stages[0]!, id: 'snow-designation-polygons', outputs: [artifact] }],
  };
  vi.mocked(loadGeoAnalysisManifest).mockResolvedValue(manifest);
  vi.mocked(fetchFromR2AsJson).mockResolvedValue(source);
  return {
    source,
    artifact,
    expected: { generatedAt, sha256: artifact.sha256 },
  };
}
beforeEach(() => vi.resetAllMocks());
it('原典で指定なしの県の空境界を取得失敗と区別する', async () => {
  const f = fixture();
  expect(await fetchGeoSnowSourceAction('13', f.expected)).toEqual({
    type: 'FeatureCollection',
    features: [],
  });
});
it.each(['48', '../13', '13\n', '13000'])(
  '不正な県を取得前に拒否する %s',
  async (pref) => {
    const f = fixture();
    expect(await fetchGeoSnowSourceAction(pref, f.expected)).toBeNull();
    expect(loadGeoAnalysisManifest).not.toHaveBeenCalled();
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  }
);
it('配信版の切替時に表示中の人口へ別版の境界を混ぜない', async () => {
  const f = fixture();
  expect(
    await fetchGeoSnowSourceAction('13', {
      ...f.expected,
      generatedAt: '2026-09-10T00:00:00Z',
    })
  ).toBeNull();
  expect(fetchFromR2AsJson).not.toHaveBeenCalled();
});
it('同時刻でも異なる原典SHAは拒否する', async () => {
  const f = fixture();
  expect(
    await fetchGeoSnowSourceAction('13', {
      ...f.expected,
      sha256: '0'.repeat(64),
    })
  ).toBeNull();
});
it('取得後に改変された境界を拒否する', async () => {
  const f = fixture();
  vi.mocked(fetchFromR2AsJson).mockResolvedValue({
    ...f.source,
    features: [{ type: 'Feature' }],
  });
  expect(await fetchGeoSnowSourceAction('13', f.expected)).toBeNull();
});
it('不明な区域種別を描画しない', async () => {
  const f = fixture([
    {
      type: 'Feature',
      properties: { class: 3 },
      geometry: { type: 'Polygon', coordinates: [] },
    },
  ]);
  expect(await fetchGeoSnowSourceAction('13', f.expected)).toBeNull();
});
it('R2障害を指定区域ゼロにしない', async () => {
  const f = fixture();
  vi.mocked(fetchFromR2AsJson).mockRejectedValue(new Error('unavailable'));
  expect(await fetchGeoSnowSourceAction('13', f.expected)).toBeNull();
});
