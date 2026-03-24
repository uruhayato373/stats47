import { createD3Mock } from '@/d3/__tests__/helpers/d3-mock';
import type { DivergingMidpoint, VisualizationDataPoint } from '@/d3/types/color-scale';
import type { D3Module } from '@/d3/types/d3';
import * as calculateMidpointModule from '@/d3/utils/color-scale/calculate-midpoint'; // calculateMidpoint をモックするためにインポート
import { createDivergingColorScale } from '@/d3/utils/color-scale/create-diverging-color-scale';
import { beforeEach, describe, expect, it, vi } from 'vitest';

describe('createDivergingColorScale', () => {
  let d3Mock: D3Module;
  const mockData: VisualizationDataPoint[] = [
    { areaCode: '01', value: -10 },
    { areaCode: '02', value: 0 },
    { areaCode: '03', value: 10 },
    { areaCode: '04', value: 20 },
    { areaCode: '05', value: 30 },
  ];
  const emptyData: VisualizationDataPoint[] = [];
  const noDataColor = "#cccccc";

  beforeEach(() => {
    d3Mock = createD3Mock();
    // d3.scaleDiverging のモック設定
    // vi.fn() でラップし、mockImplementation を使用できるようにする
    d3Mock.scaleDiverging = vi.fn().mockImplementation((interpolator: (t: number) => string) => {
      const scale = vi.fn((value: number) => interpolator(value / 100 + 0.5)); // 簡単なマッピング
      (scale as any).domain = vi.fn().mockImplementation(function(this: any) { return this; }); // domain メソッドをチェイン可能にする
      (scale as any).range = vi.fn().mockImplementation(function(this: any) { return this; }); // range もチェイン可能にするため追加
      return scale;
    });

    // calculateMidpoint をモックして、テストケースごとに挙動を制御できるようにする
    vi.spyOn(calculateMidpointModule, 'calculateMidpoint').mockImplementation(
      (data: VisualizationDataPoint[], divergingMidpoint: DivergingMidpoint, divergingMidpointValue: number | undefined, d3: D3Module) => {
        if (typeof divergingMidpoint === 'number') return divergingMidpoint;
        if (divergingMidpoint === 'custom') return divergingMidpointValue ?? 0;
        if (divergingMidpoint === 'zero') return 0;
        if (divergingMidpoint === 'mean') return (d3 as any).mean(data.map(d => d.value)) ?? 0; // d3 を any にキャスト
        if (divergingMidpoint === 'median') return (d3 as any).median(data.map(d => d.value)) ?? 0; // d3 を any にキャスト
        return 0;
      }
    );
  });

  // 空データの場合、noDataColor を返す関数が生成される
  it('should return a function that returns noDataColor if data is empty', async () => {
    const scale = await createDivergingColorScale({
      data: emptyData,
      type: 'diverging',
      divergingMidpoint: 'zero',
      noDataColor,
      d3: d3Mock
    });
    expect(scale(100)).toBe(noDataColor);
    expect(d3Mock.scaleDiverging).not.toHaveBeenCalled();
  });

  // isSymmetrized: true でドメインが中間点を中心に対称化される
  it('should symmetrize the domain around the midpoint if isSymmetrized is true', async () => {
    const midpoint = 10; // calculateMidpoint が 10 を返すようにモック
    vi.mocked(calculateMidpointModule.calculateMidpoint).mockReturnValue(midpoint);

    const scale = await createDivergingColorScale({
      data: mockData, // min -10, max 30
      type: 'diverging',
      divergingMidpoint: midpoint,
      isSymmetrized: true,
      d3: d3Mock
    });

    // midpoint (10) からの最大絶対差は 30 (30 - 10) または 20 (10 - (-10)) -> 20
    // 実際は (30 - 10) = 20, (10 - (-10)) = 20 なので maxAbs = 20
    // domainMin = 10 - 20 = -10
    // domainMax = 10 + 20 = 30
    expect(vi.mocked(d3Mock.scaleDiverging)).toHaveBeenCalled();
    const scaleInstance = vi.mocked(d3Mock.scaleDiverging).mock.results[0].value;
    expect(scaleInstance.domain).toHaveBeenCalledWith([-10, midpoint, 30]); // -10, 10, 30 -> maxAbs = 20 -> -10, 10, 30
    // 実際の計算: dataMinValue = -10, maxValue = 30, midpoint = 10
    // maxAbs = Math.max(Math.abs(-10 - 10), Math.abs(30 - 10)) = Math.max(20, 20) = 20
    // domainMin = 10 - 20 = -10
    // domainMax = 10 + 20 = 30
    // D3 の scaleDiverging は domain を [min, mid, max] で受け取る
    expect(scaleInstance.domain).toHaveBeenCalledWith([-10, midpoint, 30]);
  });

  // isSymmetrized: false でデータの実際の最小・最大値がドメインになる
  it('should use actual min/max as domain if isSymmetrized is false', async () => {
    const midpoint = 10;
    vi.mocked(calculateMidpointModule.calculateMidpoint).mockReturnValue(midpoint);

    const scale = await createDivergingColorScale({
      data: mockData, // min -10, max 30
      type: 'diverging',
      divergingMidpoint: midpoint,
      isSymmetrized: false,
      d3: d3Mock
    });

    expect(vi.mocked(d3Mock.scaleDiverging)).toHaveBeenCalled();
    const scaleInstance = vi.mocked(d3Mock.scaleDiverging).mock.results[0].value;
    expect(scaleInstance.domain).toHaveBeenCalledWith([-10, midpoint, 30]);
  });

  // calculateMidpoint 関数との統合が正しく動作する
  it('should correctly integrate with calculateMidpoint function', async () => {
    const midpoint = 5;
    vi.mocked(calculateMidpointModule.calculateMidpoint).mockReturnValue(midpoint);

    await createDivergingColorScale({
      data: mockData,
      type: 'diverging',
      divergingMidpoint: 'mean', // calculateMidpoint が呼ばれることを確認
      d3: d3Mock
    });

    expect(calculateMidpointModule.calculateMidpoint).toHaveBeenCalledWith(
      mockData, 'mean', undefined, d3Mock
    );
    const scaleInstance = vi.mocked(d3Mock.scaleDiverging).mock.results[0].value;
    expect(scaleInstance.domain).toHaveBeenCalledWith([-10, midpoint, 30]); // isSymmetrized: false の場合
  });

  // isReversed: true で色が反転する
  it('should reverse the color scheme if isReversed is true', async () => {
    const scale = await createDivergingColorScale({
      data: mockData,
      type: 'diverging',
      divergingMidpoint: 'zero',
      isReversed: true,
      d3: d3Mock
    });
    expect(vi.mocked(d3Mock.scaleDiverging)).toHaveBeenCalled();
    const interpolator = vi.mocked(d3Mock.scaleDiverging).mock.calls[0][0];
    // 0.25 の値が 0.75 の色を返すことを確認 (1 - t)
    expect((interpolator as any)(0.25)).toBe(d3Mock.interpolateRdBu(0.75));
  });

  // 生成されたスケール関数が正しく値をマッピングすることを確認
  it('should return a function that maps values to colors', async () => {
    const scale = await createDivergingColorScale({
      data: mockData,
      type: 'diverging',
      divergingMidpoint: 'zero',
      d3: d3Mock
    });
    const color = scale(5);
    // scaleDiverging のモックが (value / 100 + 0.5) でマッピングするため、
    // 5 -> interpolateRdBu(0.55) となる (例)
    expect(color).toBe(d3Mock.interpolateRdBu(0.55));
  });
});
