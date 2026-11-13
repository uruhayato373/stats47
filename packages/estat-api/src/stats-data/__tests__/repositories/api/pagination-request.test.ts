import { afterEach, expect, it, vi } from 'vitest';
import { fetchStatsDataFromApi } from '../../../repositories/api/fetch-from-api';

afterEach(() => {
  vi.unstubAllGlobals();
  vi.unstubAllEnvs();
});

it('次ページの開始位置を公式のstartPositionとしてHTTPクエリへ渡す', async () => {
  vi.stubEnv('HTTP_PROXY', '');
  vi.stubEnv('HTTPS_PROXY', '');
  const fetch = vi.fn<typeof globalThis.fetch>(async () => new Response(JSON.stringify({ GET_STATS_DATA: { RESULT: { STATUS: 0 } } })));
  vi.stubGlobal('fetch', fetch);

  for (const startPosition of [1, 100001]) {
    await fetchStatsDataFromApi({ statsDataId: '0000020304', cdCat01: '#D1201', limit: 100000, startPosition });
  }

  const requests = fetch.mock.calls.map(([url]) => new URL(String(url)));
  expect(requests.map(url => url.searchParams.get('startPosition'))).toEqual(['1', '100001']);
  for (const url of requests) {
    expect(url.pathname).toBe('/rest/3.0/app/json/getStatsData');
    expect(url.searchParams.get('statsDataId')).toBe('0000020304');
    expect(url.searchParams.get('cdCat01')).toBe('#D1201');
    expect(url.searchParams.get('limit')).toBe('100000');
    for (const key of ['startRecord', 'cdTime', 'cdTimeFrom', 'cdTimeTo', 'cdArea']) {
      expect(url.searchParams.has(key)).toBe(false);
    }
  }
});
