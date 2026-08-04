import { describe, expect, it } from 'vitest';
import { generateCacheKey } from '../../../repositories/cache/generate-cache-key';

describe('generateCacheKey', () => {
  it('フィルタが無ければ default.json', () => {
    expect(generateCacheKey({ statsDataId: '0000010101' })).toBe(
      'estat-api/stats-data/0000010101/default.json',
    );
  });

  it('フィルタは key=value を _ で連結する', () => {
    expect(
      generateCacheKey({ statsDataId: '0000010101', cdCat01: 'A1101', cdTime: '2024100000' }),
    ).toBe('estat-api/stats-data/0000010101/cdTime=2024100000_cdCat01=A1101.json');
  });

  it('★limit / startRecord 未指定なら従来キーと同一 (既存キャッシュを無効化しない)', () => {
    const key = generateCacheKey({ statsDataId: '0000010101', cdCat01: 'A1101' });
    expect(key).toBe('estat-api/stats-data/0000010101/cdCat01=A1101.json');
  });

  it('★取得範囲が違えば別キーになる (取りこぼしをキャッシュヒットとして配らない)', () => {
    const base = generateCacheKey({ statsDataId: '0000010101', cdCat01: 'A1101' });
    const limited = generateCacheKey({
      statsDataId: '0000010101',
      cdCat01: 'A1101',
      limit: 100,
    });
    const paged = generateCacheKey({
      statsDataId: '0000010101',
      cdCat01: 'A1101',
      limit: 100,
      startRecord: 101,
    });

    expect(limited).not.toBe(base);
    expect(paged).not.toBe(limited);
    expect(limited).toContain('limit=100');
    expect(paged).toContain('startRecord=101');
  });

  it('ファイル名に使えない文字をサニタイズする', () => {
    expect(generateCacheKey({ statsDataId: '0000010201', cdCat01: '#A03503' })).toContain(
      'cdCat01=#A03503',
    );
    expect(generateCacheKey({ statsDataId: 'x', cdCat01: 'a/b c' })).toContain('cdCat01=a-b-c');
  });
});
