import { describe, expect, it } from 'vitest';

import { computeTopRankings } from '../compute-top-rankings';

import type { RankingValue } from '../../types';


/**
 * テスト用のRankingValueデータを作成するヘルパー関数
 */
function createTestData(
  areaCode: string,
  areaName: string,
  value: number
): RankingValue {
  return {
    rank: 1,
    areaCode,
    areaName,
    value,
    yearCode: '2020',
    yearName: '2020年',
    categoryCode: '001',
    categoryName: 'テスト',
    unit: '人',
  };
}

describe('computeTopRankings', () => {
  it('空配列の場合は空配列を返す', () => {
    const result = computeTopRankings([]);
    expect(result).toEqual([]);
  });

  it('デフォルトで上位3件を返す', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
      createTestData('14000', '神奈川県', 120),
      createTestData('11000', '埼玉県', 100),
      createTestData('01000', '北海道', 50),
    ];

    const result = computeTopRankings(data);

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(200); // 最大値
    expect(result[1].value).toBe(150);
    expect(result[2].value).toBe(120);
  });

  it('limitパラメータで件数を指定できる', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
      createTestData('14000', '神奈川県', 120),
    ];

    const result = computeTopRankings(data, 2);

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(200);
    expect(result[1].value).toBe(150);
  });

  it('limitが配列の長さより大きい場合は全件返す', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeTopRankings(data, 10);

    expect(result).toHaveLength(2);
  });

  it('降順ソートが適用されることを確認', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeTopRankings(data);

    expect(result[0].value).toBe(200); // 最大値
    expect(result[1].value).toBe(150);
    expect(result[2].value).toBe(100); // 最小値
  });

  it('全国データが除外されることを確認', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
      createTestData('14000', '神奈川県', 120),
    ];

    const result = computeTopRankings(data);

    expect(result).toHaveLength(3);
    expect(result.every((item) => item.areaCode !== '00000')).toBe(true);
  });

  it('データが3件未満の場合、全件返す', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeTopRankings(data);

    expect(result).toHaveLength(2);
  });

  it('1件のみの場合、その1件を返す', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
    ];

    const result = computeTopRankings(data);

    expect(result).toHaveLength(1);
    expect(result[0].areaCode).toBe('13000');
  });

  it('全国データのみの場合は空配列を返す', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
    ];

    const result = computeTopRankings(data);

    expect(result).toEqual([]);
  });
});
