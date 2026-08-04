import type { R2Bucket } from '@stats47/r2-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { CACHE_TTL_DAYS } from '../../../repositories/cache/envelope';
import { findStatsDataCache } from '../../../repositories/cache/find-cache';

const DAY = 24 * 60 * 60 * 1000;
const params = { statsDataId: '0000010101', cdCat01: 'A1101' };
const response = { GET_STATS_DATA: { STATISTICAL_DATA: {} } } as never;

function storageReturning(body: unknown): R2Bucket {
  return {
    get: vi.fn(async () =>
      body === null ? null : { text: async () => JSON.stringify(body) },
    ),
  } as unknown as R2Bucket;
}

describe('findStatsDataCache', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('鮮度内の封筒は response を返す', async () => {
    const storage = storageReturning({
      cachedAt: new Date(Date.now() - 1 * DAY).toISOString(),
      params,
      apiVersion: '3.0',
      response,
    });

    await expect(findStatsDataCache(storage, params)).resolves.toEqual(response);
  });

  it('★鮮度上限を超えた封筒は miss 扱い (再取得させる)', async () => {
    const storage = storageReturning({
      cachedAt: new Date(Date.now() - (CACHE_TTL_DAYS + 1) * DAY).toISOString(),
      response,
    });

    await expect(findStatsDataCache(storage, params)).resolves.toBeNull();
  });

  it('★cachedAt を持たない封筒は miss 扱い', async () => {
    const storage = storageReturning({ response });
    await expect(findStatsDataCache(storage, params)).resolves.toBeNull();
  });

  it('v1 封筒 (params なし) でも鮮度内なら読める (後方互換)', async () => {
    const storage = storageReturning({
      cachedAt: new Date(Date.now() - 1 * DAY).toISOString(),
      response,
    });

    await expect(findStatsDataCache(storage, params)).resolves.toEqual(response);
  });

  it('オブジェクトが無ければ null', async () => {
    await expect(findStatsDataCache(storageReturning(null), params)).resolves.toBeNull();
  });

  it('壊れた JSON は null (例外を投げない)', async () => {
    const storage = {
      get: vi.fn(async () => ({ text: async () => '{ broken' })),
    } as unknown as R2Bucket;

    await expect(findStatsDataCache(storage, params)).resolves.toBeNull();
  });
});
