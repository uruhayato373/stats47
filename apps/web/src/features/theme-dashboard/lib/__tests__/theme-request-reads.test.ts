// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * テーマのページ (/themes/<テーマ>) は、題と説明文を作る段 (generateMetadata の readThemeLeadFact) と
 * 本文の段 (loadThemeData) が、主な指標の定義 (item.json) と値 (values.json) を別々に読んでいた。
 * 同じリクエストの中では 1 回ずつにまとめ、説明文の 1 位・最下位が変わらないことを固定する (CF-RENDER-CPU-01)。
 *
 * vitest が読む React (クライアント用) の cache() は記憶を持たない素通しなので、
 * 「同じリクエストの間だけ、関数と引数ごとに結果を覚える」という同じ約束の代役に差し替える。
 */
const { readItem, readAllYears, readOneYear, requestCache, startRequest } = vi.hoisted(() => {
  let memo = new Map<unknown, Map<string, unknown>>();
  return {
    readItem: vi.fn(),
    readAllYears: vi.fn(),
    readOneYear: vi.fn(),
    startRequest: () => {
      memo = new Map();
    },
    requestCache:
      <A extends unknown[], R>(fn: (...args: A) => R) =>
      (...args: A): R => {
        const byArgs = memo.get(fn) ?? new Map<string, unknown>();
        memo.set(fn, byArgs);
        const key = JSON.stringify(args);
        if (!byArgs.has(key)) byArgs.set(key, fn(...args));
        return byArgs.get(key) as R;
      },
  };
});

vi.mock('react', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react')>()),
  cache: requestCache,
}));
vi.mock('server-only', () => ({}));
vi.mock('@stats47/data-configs/registry', () => ({ METRICS_REGISTRY: {} }));
vi.mock('@stats47/ranking/server', () => ({
  readRankingItemFromR2: readItem,
  readAllYearsRankingValuesFromR2: readAllYears,
  readRankingValuesFromR2: readOneYear,
}));
vi.mock('@stats47/stats-r2/readers', () => ({ readJapanSeries: vi.fn(async () => null) }));
vi.mock('@stats47/data-configs/theme-catalog', () => ({
  THEME_CATALOGS: {
    aging: {
      metrics: [
        { rankingKey: 'aging-rate', role: 'primary', shortLabel: '高齢化率' },
        { rankingKey: 'birth-rate', role: 'secondary', shortLabel: '出生率' },
      ],
    },
  },
}));

import { loadThemeData } from '../load-theme-data';
import { readThemeLeadFact } from '../theme-seo';

import type { ThemeConfig } from '../../types';

const theme = { themeKey: 'aging', rankingKeys: ['aging-rate', 'birth-rate'], tabIndicators: [], hideMap: true } as unknown as ThemeConfig;
const item = { success: true, data: { title: '高齢化率', unit: '%', latestYear: { yearCode: '2024100000', yearName: '2024年度' } } };
const row = (yearCode: string, areaCode: string, areaName: string, value: number, rank: number) => ({ yearCode, areaCode, areaName, value, rank });
/** values.json を新しい年から順に並べた全年の値 (読み取りが返す形) */
const allYears = {
  success: true,
  data: [
    row('2024100000', '05000', '秋田県', 39.5, 1),
    row('2024100000', '13000', '東京都', 22.7, 47),
    row('2023100000', '39000', '高知県', 36.1, 1),
    row('2023100000', '47000', '沖縄県', 23.4, 47),
  ],
};
const failed = { success: false, error: new Error('fetch failed') };
const callsFor = (mock: typeof readItem, key: string) => mock.mock.calls.filter(([k]) => k === key).length;

beforeEach(() => {
  startRequest();
  readItem.mockReset().mockResolvedValue(item);
  readAllYears.mockReset().mockResolvedValue(allYears);
  readOneYear.mockReset().mockResolvedValue({ success: true, data: [] });
});

describe('同じリクエストの中のテーマの読み込み', () => {
  it('題の段と本文の段が、主な指標の定義と値を 1 回ずつしか読まない', async () => {
    const [fact, data] = await Promise.all([readThemeLeadFact('aging'), loadThemeData(theme)]);

    expect(callsFor(readItem, 'aging-rate')).toBe(1);
    expect(callsFor(readAllYears, 'aging-rate')).toBe(1);
    // 題の段は values.json を年を指定して別に読まない
    expect(readOneYear).not.toHaveBeenCalled();
    expect(fact?.top.areaName).toBe('秋田県');
    expect(Object.keys(data?.indicatorDataMap ?? {})).toEqual(['aging-rate', 'birth-rate']);
  });

  it('説明文の 1 位・最下位は最新年の値だけから作る (ほかの年の値を混ぜない)', async () => {
    const fact = await readThemeLeadFact('aging');

    expect(fact).toMatchObject({
      itemName: '高齢化率',
      yearName: '2024年度',
      top: { areaName: '秋田県', value: 39.5 },
      bottom: { areaName: '東京都', value: 22.7 },
      ratio: '1.7',
    });
  });

  it('最新年の値が無い指標・読めない指標は、説明文に数字を入れない (null)', async () => {
    readAllYears.mockResolvedValue({ success: true, data: allYears.data.filter((v) => v.yearCode !== '2024100000') });
    expect(await readThemeLeadFact('aging')).toBeNull();

    startRequest();
    readAllYears.mockRejectedValue(new Error('ECONNRESET'));
    expect(await readThemeLeadFact('aging')).toBeNull();
  });

  it('まとめて読んでも、落ちた取得は 1 回だけ取り直す (失敗を覚えたまま指標を落とさない)', async () => {
    readItem.mockImplementationOnce(async () => failed);
    readAllYears.mockImplementationOnce(async () => {
      throw new Error('ECONNRESET');
    });

    const data = await loadThemeData({ ...theme, rankingKeys: ['aging-rate'] } as ThemeConfig);

    expect(Object.keys(data?.indicatorDataMap ?? {})).toEqual(['aging-rate']);
    expect(readItem).toHaveBeenCalledTimes(2);
    expect(readAllYears).toHaveBeenCalledTimes(2);
  });

  it('次のリクエストでは読み直す (モジュールに持ち越さない)', async () => {
    await readThemeLeadFact('aging');
    startRequest();
    await readThemeLeadFact('aging');

    expect(callsFor(readItem, 'aging-rate')).toBe(2);
    expect(callsFor(readAllYears, 'aging-rate')).toBe(2);
  });
});
