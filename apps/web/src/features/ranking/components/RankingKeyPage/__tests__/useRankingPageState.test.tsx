import { ok, err } from '@stats47/types';
import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

import { fetchNationalAverageSeriesAction } from '../../../actions/fetch-national-average-series';
import { fetchRankingValuesAction } from '../../../actions/fetch-ranking-values';
import { useRankingPageState } from '../useRankingPageState';

import type { NationalAveragePoint } from '../../../lib/build-national-average-series';
import type { RankingItem, RankingValue } from '@stats47/ranking';

vi.mock('next/navigation', () => ({
  usePathname: () => '/ranking/population',
}));
vi.mock('@/lib/analytics/events', () => ({
  trackRankingView: vi.fn(),
  trackYearChange: vi.fn(),
  trackAreaTypeChange: vi.fn(),
  trackUiInteraction: vi.fn(),
}));
vi.mock('../../../actions/fetch-ranking-values', () => ({
  fetchRankingValuesAction: vi.fn(),
}));
vi.mock('../../../actions/fetch-national-average-series', () => ({
  fetchNationalAverageSeriesAction: vi.fn(),
}));

const item = {
  rankingKey: 'population',
  title: '人口',
  categoryKey: 'population',
  calculation: {
    normalizationOptions: [
      { type: 'per_area', label: '人口密度', unit: '人/km²' },
    ],
  },
} as RankingItem;
const values = [
  { areaCode: '13000', areaName: '東京都', value: 14000000, rank: 1 },
] as RankingValue[];
const normalized = [{ ...values[0], value: 6400 }];
const series = [
  {
    year: 2024,
    yearCode: '2024',
    yearName: '2024年',
    value: 2600000,
    count: 47,
    kind: 'simple-mean',
  },
] as NationalAveragePoint[];
const normalizedSeries = [{ ...series[0], value: 340 }];
function deferred<T>() {
  let resolve!: (value: T) => void;
  const promise = new Promise<T>((done) => {
    resolve = done;
  });
  return { promise, resolve };
}
function useSubject() {
  return useRankingPageState({
    rankingKey: 'population',
    rankingItem: item,
    initialRankingValues: values,
    initialNationalAverageSeries: series,
    areaType: 'prefecture',
    selectedYear: '2024',
  });
}

describe('ranking display transitions', () => {
  beforeEach(() => {
    vi.resetAllMocks();
    window.history.replaceState(null, '', '/ranking/population');
    vi.mocked(fetchNationalAverageSeriesAction).mockResolvedValue(
      ok(normalizedSeries)
    );
  });
  it('keeps values, basis and series together until the requested values arrive', async () => {
    const request =
      deferred<Awaited<ReturnType<typeof fetchRankingValuesAction>>>();
    vi.mocked(fetchRankingValuesAction).mockReturnValue(request.promise);
    const { result } = renderHook(useSubject);
    act(() => result.current.handleNormalizationChange('per_area'));
    expect(result.current.normalizationType).toBeUndefined();
    expect(result.current.rankingValues).toEqual(values);
    expect(result.current.nationalAverageSeries).toEqual(series);
    await act(async () => request.resolve(ok(normalized)));
    expect(result.current.normalizationType).toBe('per_area');
    expect(result.current.rankingValues).toEqual(normalized);
    expect(result.current.nationalAverageSeries).toEqual(normalizedSeries);
  });
  it('preserves the previous display and URL when a basis cannot be loaded', async () => {
    vi.mocked(fetchRankingValuesAction).mockResolvedValue(
      err(new Error('unavailable'))
    );
    const { result } = renderHook(useSubject);
    await act(async () => result.current.handleNormalizationChange('per_area'));
    expect(result.current.rankingValues).toEqual(values);
    expect(result.current.normalizationType).toBeUndefined();
    expect(window.location.search).not.toContain('norm=');
  });
  it('ignores a late response after a newer year has been selected', async () => {
    const earlier =
      deferred<Awaited<ReturnType<typeof fetchRankingValuesAction>>>();
    vi.mocked(fetchRankingValuesAction)
      .mockReturnValueOnce(earlier.promise)
      .mockResolvedValueOnce(ok(normalized));
    const { result } = renderHook(useSubject);
    act(() => result.current.handleYearChange('2022'));
    await act(async () => result.current.handleYearChange('2023'));
    await act(async () => earlier.resolve(ok(values)));
    expect(result.current.currentYear).toBe('2023');
    expect(result.current.rankingValues).toEqual(normalized);
  });
});
