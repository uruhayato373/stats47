import { describe, expect, it } from 'vitest';

import {
  filterMunicipalityRanking,
  municipalityLeafName,
} from '../filter-municipality-ranking';

const values = Array.from({ length: 120 }, (_, index) => ({
  areaCode: String(10000 + index),
  areaName: `${index < 60 ? '北海道' : '青森県'} 自治体${index}`,
  prefectureCode: index < 60 ? '01000' : '02000',
  value: 120 - index,
  rank: index + 1,
}));

describe('filterMunicipalityRanking', () => {
  it('県と自治体名で絞り込み、初期DOMへ1ページ分だけ返す', () => {
    const result = filterMunicipalityRanking(values, {
      prefectureCode: '01000',
      query: '自治体1',
      pageSize: 10,
    });
    expect(result.total).toBeGreaterThan(0);
    expect(result.rows.length).toBeLessThanOrEqual(10);
    expect(result.rows.every((row) => row.prefectureCode === '01000')).toBe(
      true
    );
  });

  it('範囲外pageを最終ページへ正規化する', () => {
    const result = filterMunicipalityRanking(values, {
      page: 999,
      pageSize: 50,
    });
    expect(result.page).toBe(3);
    expect(result.rows).toHaveLength(20);
  });

  it('表示名から都道府県接頭辞を除く', () => {
    expect(municipalityLeafName('北海道 札幌市')).toBe('札幌市');
  });
});
