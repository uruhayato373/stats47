import type { R2Bucket } from '@stats47/r2-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fetchStatsDataFromApi } from '../../repositories/api/fetch-from-api';
import { findStatsDataCache } from '../../repositories/cache/find-cache';
import { fetchStatsData } from '../../services/fetch-stats-data';

const { hoistedMockEstatResponse } = vi.hoisted(() => ({
  hoistedMockEstatResponse: {
    GET_STATS_DATA: {
      RESULT: { STATUS: 0, ERROR_MSG: "" },
      PARAMETER: { LANG: "ja", STATS_DATA_ID: "testId" },
      STATISTICAL_DATA: {
        TABLE_INF: {} as any,
        CLASS_INF: {} as any,
        DATA_INF: { VALUE: [] },
      },
    }
  }
}));

vi.mock('../../repositories/api/fetch-from-api', async () => {
  const actual = await vi.importActual('../../repositories/api/fetch-from-api');
  return {
    ...actual,
    fetchStatsDataFromApi: vi.fn().mockResolvedValue(hoistedMockEstatResponse),
  };
});

vi.mock('../../repositories/cache/find-cache', async () => {
  const actual = await vi.importActual('../../repositories/cache/find-cache');
  return {
    ...actual,
    findStatsDataCache: vi.fn(),
  };
});

vi.mock('../../repositories/cache/save-cache', async () => {
  const actual = await vi.importActual('../../repositories/cache/save-cache');
  return {
    ...actual,
    saveStatsDataCache: vi.fn().mockResolvedValue(undefined),
  };
});

describe('統計データの取得 (fetchStatsData)', () => {
  const mockStorage = {} as R2Bucket;
  const statsDataId = '0003433228'; // statsDataIdを定義

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('キャッシュヒット時はAPIを呼ばない', async () => {
    vi.mocked(findStatsDataCache).mockResolvedValue(hoistedMockEstatResponse as any);

    const result = await fetchStatsData({ statsDataId }, mockStorage);

    expect(result.source).toBe('r2');
    expect(fetchStatsDataFromApi).not.toHaveBeenCalled();
  });

  it('キャッシュミス時はAPIから取得する', async () => {
    vi.mocked(findStatsDataCache).mockResolvedValue(null);

    const result = await fetchStatsData({ statsDataId }, mockStorage);

    expect(result.source).toBe('api');
    expect(fetchStatsDataFromApi).toHaveBeenCalledWith({ statsDataId });
  });

  it('storage未指定時はAPIのみ使用する', async () => {
    const result = await fetchStatsData({ statsDataId });

    expect(result.source).toBe('api');
    expect(findStatsDataCache).not.toHaveBeenCalled();
  });
});
