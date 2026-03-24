import { describe, expect, it } from 'vitest';

import { computeSortedRankings } from '../compute-sorted-rankings';

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

describe('computeSortedRankings', () => {
  it('空配列の場合は空配列を返す', () => {
    const result = computeSortedRankings([]);
    expect(result).toEqual([]);
  });

  it('デフォルトで降順にソートされる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeSortedRankings(data);

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(200); // 最大値
    expect(result[1].value).toBe(150);
    expect(result[2].value).toBe(100); // 最小値
  });

  it('order: "desc"で降順にソートされる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeSortedRankings(data, { order: 'desc' });

    expect(result[0].value).toBe(200);
    expect(result[1].value).toBe(100);
  });

  it('order: "asc"で昇順にソートされる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeSortedRankings(data, { order: 'asc' });

    expect(result[0].value).toBe(100); // 最小値
    expect(result[1].value).toBe(200); // 最大値
  });

  it('デフォルトで全国データを除外する', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeSortedRankings(data);

    expect(result).toHaveLength(2);
    expect(result.every((item) => item.areaCode !== '00000')).toBe(true);
  });

  it('excludeNational: falseで全国データを含める', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeSortedRankings(data, { excludeNational: false });

    expect(result).toHaveLength(3);
    expect(result.some((item) => item.areaCode === '00000')).toBe(true);
  });

  it('limitで件数制限ができる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
      createTestData('28000', '兵庫県', 120),
    ];

    const result = computeSortedRankings(data, { limit: 2 });

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(200); // 最大値
    expect(result[1].value).toBe(150);
  });

  it('limitが配列の長さより大きい場合は全件返す', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeSortedRankings(data, { limit: 10 });

    expect(result).toHaveLength(2);
  });

  it('複数のオプションを組み合わせて使用できる', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeSortedRankings(data, {
      order: 'asc',
      limit: 2,
      excludeNational: true,
    });

    expect(result).toHaveLength(2);
    expect(result[0].value).toBe(100); // 昇順で最小値
    expect(result[1].value).toBe(150);
    expect(result.every((item) => item.areaCode !== '00000')).toBe(true);
  });

  it('同じ値がある場合も正しくソートされる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 100),
      createTestData('27000', '大阪府', 200),
    ];

    const result = computeSortedRankings(data);

    expect(result).toHaveLength(3);
    expect(result[0].value).toBe(200);
    expect(result[1].value).toBe(100);
    expect(result[2].value).toBe(100);
  });

  it('元の配列を変更しない（不変性）', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];
    const originalData = [...data];

    computeSortedRankings(data);

    expect(data).toEqual(originalData);
  });

  it('全国データのみの場合は空配列を返す', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
    ];

    const result = computeSortedRankings(data);

    expect(result).toEqual([]);
  });
});
