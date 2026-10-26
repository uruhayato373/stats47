import { describe, expect, it } from 'vitest';

import { buildExternalContentPages, snsMetricKeys } from '../external';

// 意図 (2026-10-26): 投稿台帳の metric_keys は配列・JSON 配列の文字列・カンマ区切りの文字列が混在する。
// 文字列を配列として展開すると 1 文字ずつの key になり、指標の正本に無いとして全部捨てられていた。
describe('snsMetricKeys', () => {
  it('3 つの形をどれも key の配列にする', () => {
    expect(snsMetricKeys(['a-b', 'c'])).toEqual(['a-b', 'c']);
    expect(snsMetricKeys('["a-b","c"]')).toEqual(['a-b', 'c']);
    expect(snsMetricKeys('a-b, c')).toEqual(['a-b', 'c']);
    expect(snsMetricKeys('a-b')).toEqual(['a-b']);
    expect(snsMetricKeys(null)).toEqual([]);
    expect(snsMetricKeys('')).toEqual([]);
  });
});

describe('buildExternalContentPages', () => {
  const input = (metric_keys: string | string[] | null) => ({
    notes: [],
    posts: [{ id: 7, platform: 'x', status: 'posted', post_url: 'https://x.com/stats47/status/1', domain: 'theme', metric_keys }],
    isKnownMetric: (key: string) => key === 'births' || key === 'deaths',
    idFromHref: () => undefined,
  });

  it('文字列の metric_keys からも指標への関係を張り、正本に無い key は黙って捨てずに返す', () => {
    const result = buildExternalContentPages(input('births,deaths,unknown-key'));
    expect(result.links.map((l) => l.to)).toEqual(['ranking:births', 'ranking:deaths']);
    expect(result.unknownMetricKeys).toEqual([{ id: 'sns:7', key: 'unknown-key' }]);
  });

  it('JSON 配列の文字列も同じ結果になる', () => {
    expect(buildExternalContentPages(input('["births","deaths"]')).links.map((l) => l.to)).toEqual(['ranking:births', 'ranking:deaths']);
  });
});
