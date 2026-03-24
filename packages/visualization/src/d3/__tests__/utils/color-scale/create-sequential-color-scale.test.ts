import { createD3Mock } from '@/d3/__tests__/helpers/d3-mock';
import type { VisualizationDataPoint } from '@/d3/types/color-scale';
import type { D3Module } from '@/d3/types/d3';
import { createSequentialColorScale } from '@/d3/utils/color-scale/create-sequential-color-scale';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('createSequentialColorScale', () => {
  let d3Mock: D3Module;
  const mockData: VisualizationDataPoint[] = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: 20 },
    { areaCode: '03', value: 30 },
    { areaCode: '04', value: 40 },
    { areaCode: '05', value: 50 },
  ];
  const emptyData: VisualizationDataPoint[] = [];
  const noDataColor = "#cccccc";

  beforeEach(() => {
    d3Mock = createD3Mock();
    // d3.scaleSequential のモック設定
    // 実際には scaleSequential は関数を返すので、その関数もモックする
    d3Mock.scaleSequential = vi.fn().mockImplementation((interpolator: (t: number) => string) => {
      const scale = vi.fn((value: number) => interpolator(value / 100)); // 簡単なマッピング
      // scale.domain をモックする際に、vi.fn() の戻り値として scale 自身を返すようにする
      // これにより、scale.domain().range() のようなチェインが可能になる
      (scale as any).domain = vi.fn().mockImplementation(function(this: any) { return this; }); // this を返すように修正
      (scale as any).range = vi.fn().mockImplementation(function(this: any) { return this; }); // range もチェイン可能にするため追加
      return scale;
    });
  });

  // 空データの場合、noDataColor を返す関数が生成される
  it('should return a function that returns noDataColor if data is empty', async () => {
    const scale = await createSequentialColorScale({ data: emptyData, type: 'sequential', noDataColor, d3: d3Mock });
    expect(scale(100)).toBe(noDataColor);
    expect(vi.mocked(d3Mock.scaleSequential)).not.toHaveBeenCalled();
  });

  // minValueType: 'zero' でドメイン最小値が 0 になる
  it('should set domain min value to 0 if minValueType is "zero"', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', minValueType: 'zero', d3: d3Mock });
    expect(vi.mocked(d3Mock.scaleSequential)).toHaveBeenCalled();
    const scaleInstance = vi.mocked(d3Mock.scaleSequential).mock.results[0].value;
    expect(scaleInstance.domain).toHaveBeenCalledWith([0, 50]); // min is 0, max is 50
  });

  // minValueType: 'data-min' でドメイン最小値がデータ最小値になる
  it('should set domain min value to data min if minValueType is "data-min"', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', minValueType: 'data-min', d3: d3Mock });
    expect(vi.mocked(d3Mock.scaleSequential)).toHaveBeenCalled();
    const scaleInstance = vi.mocked(d3Mock.scaleSequential).mock.results[0].value;
    expect(scaleInstance.domain).toHaveBeenCalledWith([10, 50]); // min is 10, max is 50
  });

  // isReversed: true で色が反転する
  it('should reverse the color scheme if isReversed is true', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', isReversed: true, d3: d3Mock });
    expect(vi.mocked(d3Mock.scaleSequential)).toHaveBeenCalled();
    const interpolator = vi.mocked(d3Mock.scaleSequential).mock.calls[0][0];
    // 0.25 の値が 0.75 の色を返すことを確認 (1 - t)
    expect((interpolator as any)(0.25)).toBe(d3Mock.interpolateBlues(0.75));
  });

  // 指定した colorScheme が適用される
  it('should apply the specified colorScheme', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', colorScheme: 'interpolateRdBu', d3: d3Mock });
    expect(vi.mocked(d3Mock.scaleSequential)).toHaveBeenCalled();
    const interpolator = vi.mocked(d3Mock.scaleSequential).mock.calls[0][0];
    expect((interpolator as any)(0.5)).toBe(d3Mock.interpolateRdBu(0.5));
  });

  // 未知の colorScheme の場合、デフォルト（Blues）が適用される
  it('should apply default colorScheme (interpolateBlues) for unknown colorScheme', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', colorScheme: 'unknownScheme', d3: d3Mock });
    expect(vi.mocked(d3Mock.scaleSequential)).toHaveBeenCalled();
    const interpolator = vi.mocked(d3Mock.scaleSequential).mock.calls[0][0];
    expect((interpolator as any)(0.5)).toBe(d3Mock.interpolateBlues(0.5));
  });

  // 生成されたスケール関数が正しく値をマッピングすることを確認
  it('should return a function that maps values to colors', async () => {
    const scale = await createSequentialColorScale({ data: mockData, type: 'sequential', d3: d3Mock });
    const color = scale(25);
    // scaleSequential のモックが (value / 100) でマッピングするため、
    // 25 -> interpolateBlues(0.25) となる
    expect(color).toBe(d3Mock.interpolateBlues(0.25));
  });
});
