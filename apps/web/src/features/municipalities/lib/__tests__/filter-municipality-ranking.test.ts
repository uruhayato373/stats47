import { describe, expect, it } from 'vitest';

import {
  filterMunicipalityRanking,
  matchMunicipalityRanking,
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
});

/** 守る意図: 全国版ページのクライアント絞り込みは、ページ送りの上限 (100 件) に切られず条件に合う全行を順位順で返す */
describe('matchMunicipalityRanking', () => {
  it('県と自治体名の両方に合う行だけを、件数を切らずに順位の順で返す', () => {
    const rows = matchMunicipalityRanking(values, {
      prefectureCode: '02000',
      query: '自治体1',
    });
    // 青森県 (index 60-119) のうち名前に「自治体1」を含むのは 100-119 の 20 件
    expect(rows.map((row) => row.rank)).toEqual(
      Array.from({ length: 20 }, (_, index) => 101 + index)
    );
  });

  it('条件が無ければ全行 (ページの上限を超える 120 件) を返す', () => {
    expect(matchMunicipalityRanking(values, {})).toHaveLength(120);
  });

  it('形の違う県コードは絞り込みに使わない (クエリの値をそのまま信じない)', () => {
    expect(matchMunicipalityRanking(values, { prefectureCode: '1' })).toHaveLength(120);
  });
});
