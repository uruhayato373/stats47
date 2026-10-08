import { describe, expect, it, vi } from 'vitest';

import { fetchCitiesPayload } from '../generate-municipality-ranking';

const URL = 'https://storage.example/app/stats/x/cities.json';
const noSleep = () => Promise.resolve();

function response(status: number, body: unknown = {}): Response {
  return new Response(JSON.stringify(body), { status });
}

describe('fetchCitiesPayload', () => {
  it('接続の失敗 (fetch failed) を再試行して取れれば返す (2026-10-08 の data-refresh の再現)', async () => {
    const fetchImpl = vi
      .fn<typeof fetch>()
      .mockRejectedValueOnce(new TypeError('fetch failed'))
      .mockResolvedValueOnce(response(200, { metricKey: 'x' }));

    await expect(fetchCitiesPayload(URL, { fetchImpl, sleep: noSleep })).resolves.toEqual({ metricKey: 'x' });
    expect(fetchImpl).toHaveBeenCalledTimes(2);
  });

  it('5xx は再試行し、3 回とも失敗したら最後のエラーで落ちる', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockImplementation(async () => response(503));

    await expect(fetchCitiesPayload(URL, { fetchImpl, sleep: noSleep })).rejects.toThrow('cities source fetch failed: 503');
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it('4xx は取り直しても変わらないので再試行しない', async () => {
    const fetchImpl = vi.fn<typeof fetch>().mockResolvedValue(response(404));

    await expect(fetchCitiesPayload(URL, { fetchImpl, sleep: noSleep })).rejects.toThrow('cities source fetch failed: 404');
    expect(fetchImpl).toHaveBeenCalledTimes(1);
  });
});
