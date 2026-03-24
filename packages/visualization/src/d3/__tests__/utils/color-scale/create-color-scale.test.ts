import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createColorScale } from '@/d3/utils/color-scale/create-color-scale';
import * as sequentialModule from '@/d3/utils/color-scale/create-sequential-color-scale';
import * as divergingModule from '@/d3/utils/color-scale/create-diverging-color-scale';
import * as categoricalModule from '@/d3/utils/color-scale/create-categorical-color-scale';
import type { ColorScaleOptions } from '@/d3/types/color-scale';

describe('createColorScale', () => {
  const mockData = [{ areaCode: '01', value: 10 }];
  const mockScaleFunction = vi.fn((value: number) => `color-${value}`);

  beforeEach(() => {
    // 各スケール生成関数をモック
    vi.spyOn(sequentialModule, 'createSequentialColorScale').mockResolvedValue(mockScaleFunction);
    vi.spyOn(divergingModule, 'createDivergingColorScale').mockResolvedValue(mockScaleFunction);
    vi.spyOn(categoricalModule, 'createCategoricalColorScale').mockResolvedValue(mockScaleFunction);
  });

  // type: 'sequential' で createSequentialColorScale が呼ばれる
  it('should call createSequentialColorScale for "sequential" type', async () => {
    const options: ColorScaleOptions = {
      type: 'sequential',
      data: mockData,
      colorScheme: 'interpolateBlues',
      d3: {} as any,
    };
    const scale = await createColorScale(options);
    expect(sequentialModule.createSequentialColorScale).toHaveBeenCalledWith(options);
    expect(divergingModule.createDivergingColorScale).not.toHaveBeenCalled();
    expect(categoricalModule.createCategoricalColorScale).not.toHaveBeenCalled();
    expect(scale(10)).toBe('color-10');
  });

  // type: 'diverging' で createDivergingColorScale が呼ばれる
  it('should call createDivergingColorScale for "diverging" type', async () => {
    const options: ColorScaleOptions = {
      type: 'diverging',
      data: mockData,
      colorScheme: 'interpolateRdBu',
      divergingMidpoint: 'zero',
      d3: {} as any,
    };
    const scale = await createColorScale(options);
    expect(divergingModule.createDivergingColorScale).toHaveBeenCalledWith(options);
    expect(sequentialModule.createSequentialColorScale).not.toHaveBeenCalled();
    expect(categoricalModule.createCategoricalColorScale).not.toHaveBeenCalled();
    expect(scale(10)).toBe('color-10');
  });

  // type: 'categorical' で createCategoricalColorScale が呼ばれる
  it('should call createCategoricalColorScale for "categorical" type', async () => {
    const options: ColorScaleOptions = {
      type: 'categorical',
      data: mockData,
      colorScheme: 'schemeCategory10',
      d3: {} as any,
    };
    const scale = await createColorScale(options);
    expect(categoricalModule.createCategoricalColorScale).toHaveBeenCalledWith(options);
    expect(sequentialModule.createSequentialColorScale).not.toHaveBeenCalled();
    expect(divergingModule.createDivergingColorScale).not.toHaveBeenCalled();
    expect(scale(10)).toBe('color-10');
  });

  // 未知のタイプの場合、エラーをスローする
  it('should throw an error for unknown color scheme type', async () => {
    const options: ColorScaleOptions = {
      type: 'unknown' as any, // 未知のタイプをシミュレート
      data: mockData,
      d3: {} as any,
    };
    await expect(createColorScale(options)).rejects.toThrow('Unknown color scheme type: unknown');
  });
});
