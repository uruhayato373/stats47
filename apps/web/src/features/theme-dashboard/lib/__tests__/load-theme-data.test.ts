// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readItem, readValues, readJapan } = vi.hoisted(() => ({ readItem: vi.fn(), readValues: vi.fn(), readJapan: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@stats47/data-configs/registry', () => ({ METRICS_REGISTRY: { value: { yearFormat: 'calendar' } } }));
vi.mock('@stats47/ranking/server', () => ({
  readRankingItemFromR2: readItem,
  readAllYearsRankingValuesFromR2: readValues,
  readRankingValuesFromR2: vi.fn(),
}));
vi.mock('@stats47/stats-r2/readers', () => ({ readJapanSeries: readJapan }));
vi.mock('@stats47/gis/geoshape', () => ({ fetchPrefectureTopology: vi.fn(), fetchAllCitiesTopology: vi.fn() }));
vi.mock('@stats47/data-configs/theme-catalog', () => ({ THEME_CATALOGS: {
  grouped: { metricGroups: [{ key: 'group', rankingKeys: ['value'] }] },
} }));

import { loadThemeData } from '../load-theme-data';

import type { ThemeConfig } from '../../types';

const config = (themeKey: string) => ({ themeKey, rankingKeys: ['value'], tabIndicators: [], hideMap: true }) as unknown as ThemeConfig;
const row = (yearCode: string) => ({ areaCode: '13000', yearCode, yearName: `${yearCode}年`, value: 42 });
const okItem = { success: true, data: { latestYear: { yearCode: '2024' } } };
const okValues = { success: true, data: [row('2021'), row('2024')] };
const failed = { success: false, error: new Error('fetch failed') };
beforeEach(() => {
  readItem.mockReset().mockResolvedValue(okItem);
  readValues.mockReset().mockResolvedValue(okValues);
  readJapan.mockReset().mockResolvedValue(null);
});
describe('テーマの観測年', () => {
  // 47 都道府県の比較はランキングが受け持つので、テーマは年を固定せず最新年を読む (2026-10-31)
  it('カードの編成があっても最新年を読み、編成をそのまま返す', async () => {
    const result = await loadThemeData(config('grouped'));
    expect(result?.indicatorDataMap.value.rankingValues).toEqual([row('2024')]);
    expect(result?.metricGroups?.[0].key).toBe('group');
  });
  it('編成の無いテーマも最新年を使う', async () => {
    const result = await loadThemeData(config('existing'));
    expect(result?.indicatorDataMap.value.rankingValues).toEqual([row('2024')]);
  });
});

// 133 指標のテーマで指標ごとの取得を一斉に投げると、数件が fetch failed で落ち、その指標がページから黙って消えた
// (2026-11-03 /areas/28000/household-food-spending)。同時数の上限と 1 回の取り直しを固定する。
describe('R2 の取得の同時数と取り直し', () => {
  const keys = Array.from({ length: 40 }, (_, i) => `metric-${i}`);
  const many = { themeKey: 'existing', rankingKeys: keys, tabIndicators: [], hideMap: true } as unknown as ThemeConfig;
  /** 最初の failures 回だけ落ち、その後は value を返す読み取り (key ごとに数える) */
  const flaky = <T,>(failingKey: string, failures: number, value: T, failure: () => Promise<unknown>) => {
    let left = failures;
    return (key: string) => (key === failingKey && left-- > 0 ? failure() : Promise.resolve(value));
  };
  const callsFor = (mock: typeof readItem, key: string) => mock.mock.calls.filter(([k]) => k === key).length;

  it('指標が 40 あっても、定義・値・全国の系列の取得は同時に 24 本までしか走らない', async () => {
    let inFlight = 0;
    let peak = 0;
    const tracked = <T,>(value: T) => async () => {
      inFlight += 1;
      peak = Math.max(peak, inFlight);
      await new Promise((resolve) => setTimeout(resolve, 1));
      inFlight -= 1;
      return value;
    };
    readItem.mockImplementation(tracked(okItem));
    readValues.mockImplementation(tracked(okValues));
    readJapan.mockImplementation(tracked(null));

    const result = await loadThemeData(many);

    expect(Object.keys(result?.indicatorDataMap ?? {})).toHaveLength(40);
    expect(peak).toBe(24);
  });

  it('定義の取得が 1 回落ちても取り直し、その指標を落とさない', async () => {
    readItem.mockImplementation(flaky('metric-7', 1, okItem, () => Promise.resolve(failed)));
    const result = await loadThemeData(many);
    expect(Object.keys(result?.indicatorDataMap ?? {})).toHaveLength(40);
    expect(callsFor(readItem, 'metric-7')).toBe(2);
    expect(readItem).toHaveBeenCalledTimes(41);
  });

  it('値の取得が 1 回落ちても (失敗の結果でも例外でも) 取り直し、その指標を落とさない', async () => {
    readValues.mockImplementation(flaky('metric-7', 1, okValues, () => Promise.resolve(failed)));
    expect(Object.keys((await loadThemeData(many))?.indicatorDataMap ?? {})).toHaveLength(40);

    readValues.mockReset().mockImplementation(flaky('metric-9', 1, okValues, () => Promise.reject(new Error('ECONNRESET'))));
    expect(Object.keys((await loadThemeData(many))?.indicatorDataMap ?? {})).toHaveLength(40);
    expect(callsFor(readValues, 'metric-9')).toBe(2);
  });

  it('取り直しは 1 回だけで、2 回続けて落ちた指標だけを外す', async () => {
    readValues.mockImplementation(flaky('metric-7', 99, okValues, () => Promise.resolve(failed)));
    const result = await loadThemeData(many);
    expect(Object.keys(result?.indicatorDataMap ?? {})).toHaveLength(39);
    expect(result?.indicatorDataMap['metric-7']).toBeUndefined();
    expect(callsFor(readValues, 'metric-7')).toBe(2);
  });

  it('R2 に無い指標 (成功で空) は失敗ではないので取り直さない', async () => {
    readItem.mockImplementation((key: string) => Promise.resolve(key === 'metric-7' ? { success: true, data: null } : okItem));
    readValues.mockImplementation((key: string) => Promise.resolve(key === 'metric-9' ? { success: true, data: [] } : okValues));
    const result = await loadThemeData(many);
    expect(Object.keys(result?.indicatorDataMap ?? {})).toHaveLength(38);
    expect(callsFor(readItem, 'metric-7')).toBe(1);
    expect(callsFor(readValues, 'metric-9')).toBe(1);
  });
});
