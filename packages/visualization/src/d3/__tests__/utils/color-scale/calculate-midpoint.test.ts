import { createD3Mock } from '@/d3/__tests__/helpers/d3-mock';
import type { D3Module } from '@/d3/types/d3';
import { calculateMidpoint } from '@/d3/utils/color-scale/calculate-midpoint';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('calculateMidpoint', () => {
  let d3Mock: D3Module;
  const mockData = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: 20 },
    { areaCode: '03', value: 30 },
    { areaCode: '04', value: 40 },
    { areaCode: '05', value: 50 },
  ];
  const emptyData: any[] = [];
  const dataWithNaN = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: NaN },
    { areaCode: '03', value: 30 },
  ];
  const dataWithInfinity = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: Infinity },
    { areaCode: '03', value: 30 },
  ];

  beforeEach(() => {
    d3Mock = createD3Mock() as any; // any にキャスト
    // d3Mock.mean と d3Mock.median は createD3Mock で既にモックされているが、
    // vitest の vi.fn() でラップして呼び出しを監視できるようにする
    // d3.mean と d3.median のシグネチャに合わせてモックを修正
    d3Mock.mean = vi.fn((data: Iterable<any>, accessor?: (d: any, i: number, array: Iterable<any>) => number | null | undefined) => {
      const values = accessor ? Array.from(data).map(accessor) : Array.from(data);
      const filteredValues = values.filter((v: any) => typeof v === 'number' && !isNaN(v));
      return filteredValues.length ? filteredValues.reduce((a: number, b: number) => a + b, 0) / filteredValues.length : undefined;
    });
    d3Mock.median = vi.fn((data: Iterable<any>, accessor?: (d: any, i: number, array: Iterable<any>) => number | null | undefined) => {
      const values = accessor ? Array.from(data).map(accessor) : Array.from(data);
      const filteredValues = values.filter((v: any) => typeof v === 'number' && !isNaN(v)).sort((a: number, b: number) => a - b);
      if (filteredValues.length === 0) return undefined;
      const mid = Math.floor(filteredValues.length / 2);
      return filteredValues.length % 2 === 0 ? (filteredValues[mid - 1] + filteredValues[mid]) / 2 : filteredValues[mid];
    });
  });

  // divergingMidpoint が数値の場合、その値をそのまま返す
  it('should return the number itself if divergingMidpoint is a number', () => {
    expect(calculateMidpoint(mockData, 25, undefined, d3Mock)).toBe(25);
    expect(calculateMidpoint(mockData, -10, undefined, d3Mock)).toBe(-10);
  });

  // divergingMidpoint が "custom" で divergingMidpointValue が指定されている場合
  it('should return divergingMidpointValue if divergingMidpoint is "custom" and value is provided', () => {
    expect(calculateMidpoint(mockData, 'custom', 25, d3Mock)).toBe(25);
    expect(calculateMidpoint(mockData, 'custom', -5, d3Mock)).toBe(-5);
  });

  // divergingMidpoint が "custom" で divergingMidpointValue が undefined の場合（デフォルト 0）
  it('should return 0 if divergingMidpoint is "custom" and divergingMidpointValue is undefined', () => {
    expect(calculateMidpoint(mockData, 'custom', undefined, d3Mock)).toBe(0);
  });

  // divergingMidpoint が "zero" の場合、0 を返す
  it('should return 0 if divergingMidpoint is "zero"', () => {
    expect(calculateMidpoint(mockData, 'zero', undefined, d3Mock)).toBe(0);
  });

  // divergingMidpoint が "mean" の場合、データの平均値を返す
  it('should return the mean of the data values if divergingMidpoint is "mean"', () => {
    const expectedMean = (10 + 20 + 30 + 40 + 50) / 5; // 30
    expect(calculateMidpoint(mockData, 'mean', undefined, d3Mock)).toBe(expectedMean);
    expect(d3Mock.mean).toHaveBeenCalledWith(mockData.map(d => d.value));
  });

  // divergingMidpoint が "median" の場合、データの中央値を返す
  it('should return the median of the data values if divergingMidpoint is "median"', () => {
    const expectedMedian = 30; // [10, 20, 30, 40, 50]
    expect(calculateMidpoint(mockData, 'median', undefined, d3Mock)).toBe(expectedMedian);
    expect(d3Mock.median).toHaveBeenCalledWith(mockData.map(d => d.value));
  });

  // 空配列の場合の挙動
  it('should return 0 for "mean" or "median" if data is empty', () => {
    expect(calculateMidpoint(emptyData, 'mean', undefined, d3Mock)).toBe(0);
    expect(calculateMidpoint(emptyData, 'median', undefined, d3Mock)).toBe(0);
  });

  // NaN を含むデータの処理
  it('should handle NaN values in data for "mean" and "median"', () => {
    // d3.mean と d3.median のモックが NaN を適切に処理することを前提とする
    // createD3Mock の mean/median は NaN を無視しないため、ここでは期待値を調整
    const values = dataWithNaN.map(d => d.value); // [10, NaN, 30]
    const filteredValues = values.filter(v => typeof v === 'number' && !isNaN(v)).sort((a, b) => a - b); // [10, 30]
    const nanTestMean = (filteredValues[0] + filteredValues[1]) / 2; // 20
    const nanTestMedian = (filteredValues[0] + filteredValues[1]) / 2; // 20

    // D3 の実際の mean/median は NaN を無視するため、ここではその期待値に合わせる
    expect(calculateMidpoint(dataWithNaN, 'mean', undefined, d3Mock)).toBe(nanTestMean);
    expect(calculateMidpoint(dataWithNaN, 'median', undefined, d3Mock)).toBe(nanTestMedian);
  });

  // Infinity を含むデータの処理
  it('should handle Infinity values in data for "mean" and "median"', () => {
    // d3.mean と d3.median のモックが Infinity を適切に処理することを前提とする
    const values = dataWithInfinity.map(d => d.value); // [10, Infinity, 30]
    const expectedMean = Infinity; // (10 + Infinity + 30) / 3 = Infinity
    const expectedMedian = 30; // [10, 30, Infinity] の中央値は 30

    // createD3Mock の mean/median は Infinity をそのまま計算するため、結果は Infinity になる
    expect(calculateMidpoint(dataWithInfinity, 'mean', undefined, d3Mock)).toBe(Infinity);
    // createD3Mock の median はソートして中央値を返すため、Infinity が含まれていても動作する
    expect(calculateMidpoint(dataWithInfinity, 'median', undefined, d3Mock)).toBe(30);
  });
});
