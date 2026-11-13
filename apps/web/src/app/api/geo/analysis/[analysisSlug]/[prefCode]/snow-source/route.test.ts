// @vitest-environment node
import { createHash } from 'node:crypto';

import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { manifestFixture } from '@/features/geo-analysis/lib/__tests__/geo-manifest-fixture';
import { loadGeoAnalysisManifest } from '@/features/geo-analysis/lib/load-geo-analysis-evidence';

import { GET } from './route';

import type { GeoAnalysisEvidenceManifest } from '@stats47/gis';

// The route imports the feature's public API, which loads other R2 readers; mock only the fetch.
vi.mock('@stats47/r2-storage/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@stats47/r2-storage/server')>()),
  fetchFromR2AsJson: vi.fn(),
}));
vi.mock('@/features/geo-analysis/lib/load-geo-analysis-evidence', () => ({
  loadGeoAnalysisManifest: vi.fn(),
}));

const generatedAt = '2026-09-11T00:00:00.000Z';
const source = {
  type: 'FeatureCollection',
  slug: 'population-snow-designation',
  areaCode: '13000',
  generatedAt,
  displayOnly: true,
  features: [],
};
const body = JSON.stringify(source) + '\n';
const artifact = {
  key: 'app/geo/population-snow-designation/source/13.json',
  areaCode: '13000',
  sha256: createHash('sha256').update(body).digest('hex'),
  bytes: Buffer.byteLength(body),
  recordCount: 0,
};
const base = manifestFixture('population-flood-risk');
const manifest: GeoAnalysisEvidenceManifest = {
  ...base,
  slug: 'population-snow-designation',
  generatedAt,
  stages: [{ ...base.stages[0]!, id: 'snow-designation-polygons', outputs: [artifact] }],
};

const request = (pref: string, v = generatedAt, sha = artifact.sha256, slug = 'population-snow-designation') =>
  GET(
    new Request(
      `https://stats47.jp/api/geo/analysis/${slug}/${pref}/snow-source?${new URLSearchParams({ v, sha })}`
    ),
    { params: Promise.resolve({ analysisSlug: slug, prefCode: pref }) }
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(loadGeoAnalysisManifest).mockResolvedValue(manifest);
  vi.mocked(fetchFromR2AsJson).mockResolvedValue(source);
});

describe('豪雪指定区域の原典境界GET', () => {
  it('版とSHAが合えば原典境界を長期キャッシュで返す', async () => {
    const response = await request('13');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    expect(response.headers.get('cloudflare-cdn-cache-control')).toContain('max-age=604800');
    expect(await response.json()).toEqual({ type: 'FeatureCollection', features: [] });
  });

  it('SHAが違えば404をキャッシュせず返す', async () => {
    const response = await request('13', generatedAt, '0'.repeat(64));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it.each(['48', '../13', '13000'])('不正な県コードは取得前に404 (%s)', async (pref) => {
    const response = await request(pref);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(loadGeoAnalysisManifest).not.toHaveBeenCalled();
  });

  it('豪雪以外の分析slugは取得前に404', async () => {
    const response = await request('13', generatedAt, artifact.sha256, 'population-flood-risk');
    expect(response.status).toBe(404);
    expect(loadGeoAnalysisManifest).not.toHaveBeenCalled();
  });

  it('R2障害は指定区域ゼロにせず404', async () => {
    vi.mocked(fetchFromR2AsJson).mockRejectedValue(new Error('unavailable'));
    const response = await request('13');
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });
});
