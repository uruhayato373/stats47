// @vitest-environment node
import { KNOWN_MUNICIPALITY_RANKING_KEYS } from '@stats47/data-configs/geo-scope';
import { readMunicipalityRankingValues } from '@stats47/ranking/server';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PUBLIC_DATA_CACHE_HEADERS } from '@/lib/cache-policy';

import { dynamic, GET } from './route';

vi.mock('@stats47/ranking/server', () => ({ readMunicipalityRankingValues: vi.fn() }));

const knownKey = [...KNOWN_MUNICIPALITY_RANKING_KEYS][0]!;
const request = (rankingKey: string) =>
  GET(new Request(`https://stats47.jp/api/municipalities/ranking/${rankingKey}`), {
    params: Promise.resolve({ rankingKey }),
  });

const snapshot = {
  schemaVersion: 1 as const,
  generatedAt: '2026-11-01T00:00:00Z',
  rankingKey: knownKey,
  yearCode: '2020',
  yearName: '2020年',
  unit: '人',
  count: 2,
  values: [
    { areaCode: '13101', areaName: '東京都 千代田区', prefectureCode: '13000', value: 2, rank: 1 },
    { areaCode: '01100', areaName: '北海道 札幌市', prefectureCode: '01000', value: 1, rank: 2 },
  ],
};

beforeEach(() => {
  vi.resetAllMocks();
});

/**
 * 守る意図: 全国版ページの絞り込み用 JSON は指標ごとに 1 URL で、公開している指標だけをキャッシュする。
 * 公開していないキーを総当たりされても R2 を読まず、404 をキャッシュさせない。
 */
describe('GET /api/municipalities/ranking/[rankingKey]', () => {
  it('公開していないキーは R2 を読まずに 404 を返し、キャッシュさせない', async () => {
    const response = await request('not-a-municipality-ranking');
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
    expect(readMunicipalityRankingValues).not.toHaveBeenCalled();
  });

  it('R2 に値が無いときも 404 をキャッシュさせない', async () => {
    vi.mocked(readMunicipalityRankingValues).mockResolvedValue(null);
    const response = await request(knownKey);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('R2 の読み出しが失敗しても 500 にせず、キャッシュさせない 404 を返す', async () => {
    vi.mocked(readMunicipalityRankingValues).mockRejectedValue(new Error('r2 down'));
    const response = await request(knownKey);
    expect(response.status).toBe(404);
    expect(response.headers.get('cache-control')).toBe('private, no-store');
  });

  it('revalidate を持たず force-dynamic (404 を route の保存先に固着させない)', async () => {
    expect(dynamic).toBe('force-dynamic');
    const route = await import('./route');
    expect('revalidate' in route).toBe(false);
  });

  it('公開している指標は全行を edge 1 日のヘッダ付きで返す', async () => {
    vi.mocked(readMunicipalityRankingValues).mockResolvedValue(snapshot);
    const response = await request(knownKey);
    expect(response.status).toBe(200);
    for (const [name, value] of Object.entries(PUBLIC_DATA_CACHE_HEADERS)) {
      expect(response.headers.get(name)).toBe(value);
    }
    expect(response.headers.get('content-type')).toContain('application/json');
    const body = await response.json();
    expect(body).toEqual({
      rankingKey: knownKey,
      yearCode: '2020',
      unit: '人',
      values: snapshot.values,
    });
    expect(readMunicipalityRankingValues).toHaveBeenCalledWith(knownKey);
  });
});
