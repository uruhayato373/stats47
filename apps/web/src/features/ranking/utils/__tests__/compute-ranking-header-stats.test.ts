// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { computeRankingHeaderStats } from '../compute-ranking-header-stats';

import type { RankingValue } from '@stats47/ranking';

const row = (rank: number, value: number | null = rank): RankingValue => ({
  metricKey: 'test', areaCode: `${String(rank).padStart(2, '0')}000`, areaName: `地域${rank}`,
  yearCode: '2024', yearName: '2024年', value, rank, unit: '人',
});

describe('computeRankingHeaderStats', () => {
  it('selects both ends by rank and keeps lower ranks in ascending order regardless of input order', () => {
    const rows = Array.from({ length: 47 }, (_, index) => row(index + 1));
    const result = computeRankingHeaderStats([...rows].reverse());
    expect(result.top3.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(result.bottom3.map((entry) => entry.rank)).toEqual([45, 46, 47]);
    expect(result.average).toBe(24);
    expect(result.count).toBe(47);
  });
  it('excludes the national total and missing or non-finite values from both selections and the mean', () => {
    const rows = Array.from({ length: 6 }, (_, index) => row(index + 1));
    const result = computeRankingHeaderStats([...rows, row(0, 10000), row(7, null), row(8, NaN), row(9, Infinity)]);
    expect(result.top3.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(result.bottom3.map((entry) => entry.rank)).toEqual([4, 5, 6]);
    expect(result.count).toBe(6);
    expect(result.average).toBe(3.5);
  });
  it('keeps different regions with tied ranks rather than deduplicating the rank number', () => {
    const rows = [row(1), { ...row(2), rank: 1 }, row(3), row(4), { ...row(5), rank: 6 }, row(6)];
    const result = computeRankingHeaderStats(rows);
    expect(result.top3.map((entry) => entry.rank)).toEqual([1, 1, 3]);
    expect(result.bottom3.map((entry) => entry.rank)).toEqual([4, 6, 6]);
  });
  it('allows small overlapping selections and returns no entries when all data are missing', () => {
    const small = computeRankingHeaderStats([row(1), row(2), row(3), row(4)]);
    expect(small.top3.map((entry) => entry.rank)).toEqual([1, 2, 3]);
    expect(small.bottom3.map((entry) => entry.rank)).toEqual([2, 3, 4]);
    expect(computeRankingHeaderStats([row(1, null)])).toEqual({ top3: [], bottom3: [], average: null, count: 0 });
  });
});
