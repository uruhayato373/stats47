// @vitest-environment node
import { describe, expect, it } from 'vitest';

import { surveyLatestYear } from './survey-latest-year';

const year = (yearCode: string) => ({ yearCode, yearName: `${yearCode}年` });

describe('surveyLatestYear (調査ハブの見出しの最新年)', () => {
  const CENSUS_CYCLE = { intervalYears: 5, anchorYear: 2020 };

  it('実施周期のある調査は、掲載データの年のうち実施年に当たる最新の年を返す', () => {
    // 2026-09-25 の点検: 総人口 (国勢調査と人口推計の両方が原典) の最新年 2024 を国勢調査の最新回のように出していた
    const items = [
      { latestYear: year('2024'), availableYears: [year('2024'), year('2023'), year('2020')] },
      { latestYear: year('2020'), availableYears: [year('2020'), year('2015')] },
    ];
    expect(surveyLatestYear(items, CENSUS_CYCLE)).toBe('2020');
  });

  it('新しい回のデータを取り込むと、その回の年になる', () => {
    const items = [
      { latestYear: year('2024'), availableYears: [year('2024'), year('2020')] },
      { latestYear: year('2025'), availableYears: [year('2025')] },
    ];
    expect(surveyLatestYear(items, CENSUS_CYCLE)).toBe('2025');
  });

  it('最新年が実施年でない指標でも、過去の実施年のデータがあればその年を返す', () => {
    const items = [{ latestYear: year('2024'), availableYears: [year('2024'), year('2020'), year('2015')] }];
    expect(surveyLatestYear(items, CENSUS_CYCLE)).toBe('2020');
  });

  it('実施年に当たるデータが 1 つも無ければ null (年を出さない)', () => {
    const items = [{ latestYear: year('2024'), availableYears: [year('2024'), year('2023')] }];
    expect(surveyLatestYear(items, CENSUS_CYCLE)).toBeNull();
  });

  it('実施周期を持たない調査 (毎年の調査) は、掲載データの最新年を返す', () => {
    const items = [
      { latestYear: year('2023'), availableYears: [year('2023'), year('2022')] },
      { latestYear: year('2024'), availableYears: null },
    ];
    expect(surveyLatestYear(items)).toBe('2024');
  });

  it('JSON 文字列の年・4 桁でない年・欠損を読み飛ばす', () => {
    const items = [
      { latestYear: JSON.stringify(year('2020')), availableYears: JSON.stringify([year('2020')]) },
      { latestYear: { yearCode: '2021100000' }, availableYears: 'not json' },
      { latestYear: null, availableYears: undefined },
    ];
    expect(surveyLatestYear(items, CENSUS_CYCLE)).toBe('2020');
    expect(surveyLatestYear([])).toBeNull();
  });
});
