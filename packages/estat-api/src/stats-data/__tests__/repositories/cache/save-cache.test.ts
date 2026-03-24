
import type { R2Bucket } from '@stats47/r2-storage';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { generateCacheKey } from '../../../repositories/cache/generate-cache-key';
import { saveStatsDataCache } from '../../../repositories/cache/save-cache';

vi.mock('../../../repositories/cache/generate-cache-key');
vi.mock('../../../repositories/cache/sanitize-metadata', () => ({
  sanitizeMetadata: vi.fn((str) => `sanitized-${str}`),
}));

describe('saveStatsDataCache', () => {
  const mockStorage = {
    put: vi.fn(),
  } as unknown as R2Bucket;

  const params = {
    statsDataId: 'test-id',
    cdCat01: '001',
  };

  const data = {
    GET_STATS_DATA: {
      STATISTICAL_DATA: {
        TABLE_INF: {
          TITLE: { $: 'test title' },
        },
      },
    },
  } as any;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(generateCacheKey).mockReturnValue('test-key');
  });

  it('R2に正しいキーとデータで保存する', async () => {
    await saveStatsDataCache(mockStorage, params, data);

    expect(generateCacheKey).toHaveBeenCalledWith(params);
    
    // R2 put の検証
    expect(mockStorage.put).toHaveBeenCalledTimes(1);
    const [key, body, options] = vi.mocked(mockStorage.put).mock.calls[0];
    
    expect(key).toBe('test-key');
    
    // メタデータの検証
    expect(options?.customMetadata).toEqual({
      "stats-data-id": 'test-id',
      "saved-at": expect.any(String),
      "table-title": 'sanitized-test title',
    });

    // ボディの検証 (エンベロープ)
    const parsedBody = JSON.parse(body as string);
    expect(parsedBody).toMatchObject({
      response: data,
      cachedAt: expect.any(String),
    });
  });

  it('タイトルがない場合もエラーにならず保存する', async () => {
    const dataWithoutTitle = {
        GET_STATS_DATA: {
            STATISTICAL_DATA: {
                TABLE_INF: {},
            },
        },
    } as any;

    await saveStatsDataCache(mockStorage, params, dataWithoutTitle);

    expect(mockStorage.put).toHaveBeenCalled();
    const [_key, _body, options] = vi.mocked(mockStorage.put).mock.calls[0];
    
    expect(options?.customMetadata?.["table-title"]).toBe('sanitized-');
  });
});
