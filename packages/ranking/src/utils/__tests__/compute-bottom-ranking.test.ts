import { describe, expect, it } from 'vitest';

import { computeBottomRanking } from '../compute-bottom-ranking';

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

describe('computeBottomRanking', () => {
  it('空配列の場合はnullを返す', () => {
    const result = computeBottomRanking([]);
    expect(result).toBeNull();
  });

  it('最下位1件を正しく取得する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeBottomRanking(data);

    expect(result).not.toBeNull();
    expect(result?.areaCode).toBe('01000'); // 最小値（最下位）
    expect(result?.value).toBe(100);
  });

  it('降順ソートが適用されることを確認', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
      createTestData('01000', '北海道', 100),
      createTestData('27000', '大阪府', 150),
    ];

    const result = computeBottomRanking(data);

    // 降順ソート後、最後の要素が最下位
    expect(result?.areaCode).toBe('01000');
    expect(result?.value).toBe(100);
  });

  it('全国データが除外されることを確認', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
    ];

    const result = computeBottomRanking(data);

    // 全国データは除外され、都道府県データの最下位が返される
    expect(result).not.toBeNull();
    expect(result?.areaCode).toBe('01000');
    expect(result?.areaCode).not.toBe('00000');
  });

  it('1件のみの場合はその1件を返す', () => {
    const data: RankingValue[] = [
      createTestData('13000', '東京都', 200),
    ];

    const result = computeBottomRanking(data);

    expect(result).not.toBeNull();
    expect(result?.areaCode).toBe('13000');
    expect(result?.value).toBe(200);
  });

  it('全国データのみの場合はnullを返す', () => {
    const data: RankingValue[] = [
      createTestData('00000', '全国', 1000),
    ];

    const result = computeBottomRanking(data);

    expect(result).toBeNull();
  });

  it('同じ値がある場合も正しく最下位を取得する', () => {
    const data: RankingValue[] = [
      createTestData('01000', '北海道', 100),
      createTestData('13000', '東京都', 200),
      createTestData('27000', '大阪府', 100), // 同じ値
    ];

    const result = computeBottomRanking(data);

    // 最下位は100の値を持つ要素のいずれか
    expect(result).not.toBeNull();
    expect(result?.value).toBe(100);
    expect(['01000', '27000']).toContain(result?.areaCode);
  });
});
