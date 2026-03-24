import type { VisualizationDataPoint } from '@/d3/types/color-scale';
import type { MapVisualizationConfig } from '@/d3/types/map-chart';
import { createChoroplethColorMapper } from '@/d3/utils/color-scale/create-choropleth-color-mapper';
import * as createColorScaleModule from '@/d3/utils/color-scale/create-color-scale'; // createColorScale をモックするためにインポート
import { describe, expect, it, vi } from 'vitest';

describe('createChoroplethColorMapper', () => {
  const mockData: VisualizationDataPoint[] = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: 20 },
    { areaCode: '03', value: 30 },
  ];
  const noDataColor = "#e0e0e0";

  // createColorScale をモック
  // 実際には createColorScale は非同期関数で、(value: number) => string を返す
  const mockColorScale = vi.fn((value: number) => {
    if (value === 10) return 'red';
    if (value === 20) return 'green';
    if (value === 30) return 'blue';
    return 'black'; // 予期しない値
  });

  beforeEach(() => {
    vi.spyOn(createColorScaleModule, 'createColorScale').mockResolvedValue(mockColorScale);
  });

  // データに存在する areaCode に対して正しい色を返す
  it('should return the correct color for an existing areaCode', async () => {
    const mapper = await createChoroplethColorMapper({ colorSchemeType: 'sequential' }, mockData);
    expect(mapper('01')).toBe('red');
    expect(mapper('02')).toBe('green');
    expect(mapper('03')).toBe('blue');
  });

  // データに存在しない areaCode に対して noDataColor を返す
  it('should return noDataColor for a non-existing areaCode', async () => {
    // noDataColor は mapConfigToColorOptions の中でデフォルト値が適用される
    const mapper = await createChoroplethColorMapper({ colorSchemeType: 'sequential' }, mockData);
    expect(mapper('99')).toBe(noDataColor);
    expect(mapper('00')).toBe(noDataColor);
  });

  // createColorScale との統合が正しく動作する
  it('should correctly integrate with createColorScale', async () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'sequential',
      colorScheme: 'interpolateBlues',
    };
    await createChoroplethColorMapper(config, mockData);
    expect(createColorScaleModule.createColorScale).toHaveBeenCalled();
  });

  // noDataColor がオプションで指定された場合に適用されること
  it('should apply custom noDataColor if provided in options', async () => {
    const customNoDataColor = '#ff00ff';
    // noDataColor は mapConfigToColorOptions の中で適用される
    const mapper = await createChoroplethColorMapper({ colorSchemeType: 'sequential', noDataColor: customNoDataColor } as any, mockData);
    expect(mapper('99')).toBe(customNoDataColor);
  });
});
