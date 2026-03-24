import { describe, expect, it } from 'vitest';

import { computeRankingStats } from '../compute-ranking-stats';

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

describe('computeRankingStats', () => {
  it('空配列の場合はnullを返す', () => {
    const result = computeRankingStats([]);
    expect(result).toBeNull();
  });

  it('nullの場合はnullを返す', () => {
    const result = computeRankingStats(null as unknown as RankingValue[]);
    expect(result).toBeNull();
  });

  it('全国データのみの場合はnullを返す', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
    ];

    const result = computeRankingStats(data);

    expect(result).toBeNull();
  });

  it('全国データと都道府県データがある場合、全国データを除外して計算する', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000), // 除外される
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result).not.toBeNull();
    expect(result?.sum).toBe(600); // 100 + 200 + 300
    expect(result?.mean).toBe(200); // (100 + 200 + 300) / 3
    expect(result?.median).toBe(200); // 中央値
    expect(result?.max).toBe(300); // 最大値
    expect(result?.min).toBe(100); // 最小値
    expect(result?.standardDeviation).toBeCloseTo(81.65, 1); // 標本標準偏差
    expect(result?.hasVariation).toBe(true);
    expect(result?.count).toBe(3); // 全国データを除外した件数
  });

  it('合計値を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result?.sum).toBe(600); // 100 + 200 + 300
  });

  it('平均値を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result?.mean).toBe(200); // (100 + 200 + 300) / 3
  });

  it('中央値を正しく計算する（奇数の場合）', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result?.median).toBe(200); // 中央の値
  });

  it('中央値を正しく計算する（偶数の場合）', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
      createTestData('28000', '兵庫県', 400),
    ];

    const result = computeRankingStats(data);

    expect(result?.median).toBe(250); // (200 + 300) / 2
  });

  it('最大値を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result?.max).toBe(300);
  });

  it('最小値を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    expect(result?.min).toBe(100);
  });

  it('データ件数を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000), // 除外される
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeRankingStats(data);

    expect(result?.count).toBe(2); // 全国データを除外した件数
  });

  it('標準偏差を正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 300),
    ];

    const result = computeRankingStats(data);

    // 標本標準偏差の計算
    // 平均: 200
    // 分散: ((100-200)^2 + (200-200)^2 + (300-200)^2) / 3 = (10000 + 0 + 10000) / 3 = 6666.67
    // 標準偏差: sqrt(6666.67) ≈ 81.65
    expect(result?.standardDeviation).toBeCloseTo(81.65, 1);
  });

  it('すべての値が同じ場合、標準偏差は0になる', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 100),
      createTestData('27000', '大阪府', 100),
    ];

    const result = computeRankingStats(data);

    expect(result?.sum).toBe(300); // 100 + 100 + 100
    expect(result?.mean).toBe(100);
    expect(result?.median).toBe(100); // すべて同じ値なので中央値も100
    expect(result?.max).toBe(100);
    expect(result?.min).toBe(100);
    expect(result?.standardDeviation).toBe(0);
    expect(result?.hasVariation).toBe(false);
    expect(result?.count).toBe(3);
  });

  it('hasVariationは標準偏差が0より大きい場合にtrue', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeRankingStats(data);

    expect(result?.hasVariation).toBe(true);
  });

  it('hasVariationは標準偏差が0の場合にfalse', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 100),
    ];

    const result = computeRankingStats(data);

    expect(result?.hasVariation).toBe(false);
  });

  it('1件のみの場合も正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
    ];

    const result = computeRankingStats(data);

    expect(result?.sum).toBe(200);
    expect(result?.mean).toBe(200);
    expect(result?.median).toBe(200); // 1件のみなので中央値も同じ
    expect(result?.max).toBe(200);
    expect(result?.min).toBe(200);
    expect(result?.standardDeviation).toBe(0); // 1件のみなので標準偏差は0
    expect(result?.hasVariation).toBe(false);
    expect(result?.count).toBe(1);
  });

  it('負の値も正しく計算する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', -100),
      createTestData('13000', '東京都', 0),
      createTestData('27000', '大阪府', 100),
    ];

    const result = computeRankingStats(data);

    expect(result?.sum).toBe(0); // -100 + 0 + 100
    expect(result?.mean).toBe(0); // (-100 + 0 + 100) / 3
    expect(result?.median).toBe(0); // 中央値
    expect(result?.max).toBe(100);
    expect(result?.min).toBe(-100);
    expect(result?.standardDeviation).toBeCloseTo(81.65, 1);
    expect(result?.hasVariation).toBe(true);
    expect(result?.count).toBe(3);
  });
});
