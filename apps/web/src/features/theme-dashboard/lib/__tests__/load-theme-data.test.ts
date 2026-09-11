import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readItem, readValues } = vi.hoisted(() => ({ readItem: vi.fn(), readValues: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@stats47/ranking/server', () => ({
  readRankingItemFromR2: readItem,
  readAllYearsRankingValuesFromR2: readValues,
  readRankingValuesFromR2: vi.fn(),
}));
vi.mock('@stats47/gis/geoshape', () => ({ fetchPrefectureTopology: vi.fn(), fetchAllCitiesTopology: vi.fn() }));
vi.mock('@stats47/data-configs/theme-catalog', () => ({ THEME_CATALOGS: {
  fixed: { metricGroups: [{ rankingKeys: ['value'], comparisonYear: '2021' }] },
} }));

import { loadThemeData } from '../load-theme-data';

import type { ThemeConfig } from '../../types';

const config = (themeKey: string) => ({ themeKey, rankingKeys: ['value'], tabIndicators: [], hideMap: true }) as unknown as ThemeConfig;
const row = (yearCode: string) => ({ areaCode: '13000', yearCode, yearName: `${yearCode}年`, value: 42 });
beforeEach(() => {
  readItem.mockResolvedValue({ success: true, data: { latestYear: { yearCode: '2024' } } });
  readValues.mockResolvedValue({ success: true, data: [row('2021'), row('2024')] });
});
describe('テーマの固定比較年', () => {
  it('最新年ではなくカタログの比較年を読み込む', async () => {
    const result = await loadThemeData(config('fixed'));
    expect(result?.indicatorDataMap.value.rankingValues).toEqual([row('2021')]);
  });
  it('指定年が欠けている場合は他年で穴埋めしない', async () => {
    readValues.mockResolvedValue({ success: true, data: [row('2024')] });
    expect(await loadThemeData(config('fixed'))).toBeNull();
  });
  it('比較年を固定しない既存テーマは最新年を使う', async () => {
    const result = await loadThemeData(config('existing'));
    expect(result?.indicatorDataMap.value.rankingValues).toEqual([row('2024')]);
  });
});
