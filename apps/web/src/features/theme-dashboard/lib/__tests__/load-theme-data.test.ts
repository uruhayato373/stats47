import { beforeEach, describe, expect, it, vi } from 'vitest';

const { readItem, readValues } = vi.hoisted(() => ({ readItem: vi.fn(), readValues: vi.fn() }));
vi.mock('server-only', () => ({}));
vi.mock('@stats47/data-configs/registry', () => ({ METRICS_REGISTRY: { value: { yearFormat: 'calendar' } } }));
vi.mock('@stats47/ranking/server', () => ({
  readRankingItemFromR2: readItem,
  readAllYearsRankingValuesFromR2: readValues,
  readRankingValuesFromR2: vi.fn(),
}));
vi.mock('@stats47/gis/geoshape', () => ({ fetchPrefectureTopology: vi.fn(), fetchAllCitiesTopology: vi.fn() }));
vi.mock('@stats47/data-configs/theme-catalog', () => ({ THEME_CATALOGS: {
  grouped: { metricGroups: [{ key: 'group', rankingKeys: ['value'] }] },
} }));

import { loadThemeData } from '../load-theme-data';

import type { ThemeConfig } from '../../types';

const config = (themeKey: string) => ({ themeKey, rankingKeys: ['value'], tabIndicators: [], hideMap: true }) as unknown as ThemeConfig;
const row = (yearCode: string) => ({ areaCode: '13000', yearCode, yearName: `${yearCode}年`, value: 42 });
beforeEach(() => {
  readItem.mockResolvedValue({ success: true, data: { latestYear: { yearCode: '2024' } } });
  readValues.mockResolvedValue({ success: true, data: [row('2021'), row('2024')] });
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
