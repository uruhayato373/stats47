import { describe, expect, it } from 'vitest';
import { CACHE_TTL_DAYS, isStale } from '../../../repositories/cache/envelope';

const NOW = Date.parse('2026-08-04T00:00:00.000Z');
const DAY = 24 * 60 * 60 * 1000;

describe('isStale', () => {
  it('鮮度上限内なら stale ではない', () => {
    expect(isStale(new Date(NOW - 1 * DAY).toISOString(), NOW)).toBe(false);
    expect(isStale(new Date(NOW - (CACHE_TTL_DAYS - 1) * DAY).toISOString(), NOW)).toBe(false);
  });

  it('鮮度上限を超えたら stale (再取得させる)', () => {
    // ★統計表は年次更新されるので、無期限キャッシュだと新年度データが永久に反映されない
    expect(isStale(new Date(NOW - (CACHE_TTL_DAYS + 1) * DAY).toISOString(), NOW)).toBe(true);
    expect(isStale(new Date(NOW - 365 * DAY).toISOString(), NOW)).toBe(true);
  });

  it('cachedAt が欠落・不正なら stale (v1 以前の壊れた封筒を通さない)', () => {
    expect(isStale(undefined, NOW)).toBe(true);
    expect(isStale(null, NOW)).toBe(true);
    expect(isStale('', NOW)).toBe(true);
    expect(isStale('not-a-date', NOW)).toBe(true);
    expect(isStale(12345, NOW)).toBe(true);
  });

  it('ttlDays を明示すればその値で判定する', () => {
    const twoDaysAgo = new Date(NOW - 2 * DAY).toISOString();
    expect(isStale(twoDaysAgo, NOW, 1)).toBe(true);
    expect(isStale(twoDaysAgo, NOW, 3)).toBe(false);
  });
});
