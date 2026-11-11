import { buildFloodPrefDetail } from '@stats47/gis';
import { fetchFromR2AsJson } from '@stats47/r2-storage/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import {
  bindFixtureArtifact,
  manifestFixture,
} from '@/features/geo-analysis/lib/__tests__/geo-manifest-fixture';

import { GET } from './route';

// The route imports the feature's public API, which loads other R2 readers; mock only the fetch.
vi.mock('@stats47/r2-storage/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@stats47/r2-storage/server')>()),
  fetchFromR2AsJson: vi.fn(),
}));

const generatedAt = '2026-09-05T00:00:00.000Z';
const detail = buildFloodPrefDetail({
  generatedAt,
  areaCode: '13000',
  areaName: '東京都',
  meshes: [
    {
      meshId: '53394525',
      areaCode: '13000',
      longitude: 139.70625,
      latitude: 35.6041665,
      bounds: [139.7, 35.6, 139.7125, 35.608333],
      population2020: 100,
      population2050: 80,
      floodDepthClass: 2,
    },
  ],
});
const manifest = bindFixtureArtifact(
  { ...manifestFixture('population-flood-risk'), generatedAt },
  'app/geo/population-flood-risk/pref/13.json',
  detail
);
const sha = manifest.stages[0]!.outputs.find((o) => o.areaCode === '13000')!.sha256;

const request = (slug: string, pref: string, v = generatedAt, s = sha) =>
  GET(
    new Request(
      `https://stats47.jp/api/geo/analysis/${slug}/${pref}?${new URLSearchParams({ v, sha: s })}`
    ),
    { params: Promise.resolve({ analysisSlug: slug, prefCode: pref }) }
  );

beforeEach(() => {
  vi.resetAllMocks();
  vi.mocked(fetchFromR2AsJson).mockResolvedValueOnce(detail).mockResolvedValueOnce(manifest);
});

describe('Geo分析の県detail GET', () => {
  it('版とSHAが合えば県detailを長期キャッシュで返す', async () => {
    const response = await request('population-flood-risk', '13');
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('public, max-age=86400');
    expect(response.headers.get('cloudflare-cdn-cache-control')).toContain('max-age=604800');
    expect(await response.json()).toEqual(detail);
  });

  it('SHAが表示中の版と違えば404をキャッシュせず返す', async () => {
    const response = await request('population-flood-risk', '13', generatedAt, 'b'.repeat(64));
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('生成時刻が配信中の版と違えば404をキャッシュせず返す', async () => {
    const response = await request('population-flood-risk', '13', '2026-09-06T00:00:00.000Z');
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it.each([
    ['https:%2F%2Fexample.com', '13'],
    ['unknown-analysis', '13'],
    ['population-flood-risk', '48'],
    ['population-flood-risk', '../13'],
    ['population-flood-risk', '13000'],
  ])('未知のslugや不正な県コードはR2へ渡さず404 (%s, %s)', async (slug, pref) => {
    const response = await request(slug, pref);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });

  it('v・shaが形式不正ならR2へ渡さず404', async () => {
    const response = await request('population-flood-risk', '13', 'invalid', 'x');
    expect(response.status).toBe(404);
    expect(fetchFromR2AsJson).not.toHaveBeenCalled();
  });
});
