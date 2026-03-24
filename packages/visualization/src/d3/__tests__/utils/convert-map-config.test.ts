import { describe, it, expect } from 'vitest';
import { mapConfigToColorOptions } from '@/d3/utils/convert-map-config';
import type { MapVisualizationConfig } from '@/d3/types/map-chart';
import type { VisualizationDataPoint } from '@/d3/types/color-scale';

describe('mapConfigToColorOptions', () => {
  const mockData: VisualizationDataPoint[] = [
    { areaCode: '01', value: 10 },
    { areaCode: '02', value: 20 },
  ];

  // 各 colorSchemeType に対する設定変換
  it('should convert to sequential options for "sequential" type', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'sequential',
      colorScheme: 'interpolateGreens',
      minValueType: 'zero',
      isReversed: true,
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options).toEqual({
      type: 'sequential',
      data: mockData,
      colorScheme: 'interpolateGreens',
      minValueType: 'zero',
      isReversed: true,
      noDataColor: '#e0e0e0',
    });
  });

  it('should convert to diverging options for "diverging" type', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'diverging',
      colorScheme: 'interpolateRdBu',
      divergingMidpoint: 'custom',
      divergingMidpointValue: 15,
      isSymmetrized: true,
      isReversed: false,
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options).toEqual({
      type: 'diverging',
      data: mockData,
      colorScheme: 'interpolateRdBu',
      divergingMidpoint: 'custom',
      divergingMidpointValue: 15,
      isSymmetrized: true,
      isReversed: false,
      noDataColor: '#e0e0e0',
    });
  });

  it('should convert to categorical options for "categorical" type', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'categorical',
      colorScheme: 'schemeCategory10',
      isReversed: true,
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options).toEqual({
      type: 'categorical',
      data: mockData,
      colorScheme: 'schemeCategory10',
      isReversed: true,
      noDataColor: '#e0e0e0',
    });
  });

  // デフォルト値の設定確認
  it('should return default sequential options if colorConfig is undefined', () => {
    const options = mapConfigToColorOptions(undefined, mockData);
    expect(options).toEqual({
      type: 'sequential',
      data: mockData,
      colorScheme: 'interpolateBlues',
      noDataColor: '#e0e0e0',
    });
  });

  it('should return default sequential options if colorSchemeType is unknown', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'unknown' as any, // 未知のタイプをシミュレート
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options).toEqual({
      type: 'sequential',
      data: mockData,
      colorScheme: 'interpolateBlues',
      noDataColor: '#e0e0e0',
    });
  });

  it('should use default colorScheme for sequential if not provided', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'sequential',
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options.colorScheme).toBe('interpolateBlues');
  });

  it('should use default colorScheme for diverging if not provided', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'diverging',
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options.colorScheme).toBe('interpolateBlues'); // デフォルトはinterpolateBlues
  });

  it('should use default divergingMidpoint for diverging if not provided', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'diverging',
    };
    const options = mapConfigToColorOptions(config, mockData);
    if (options.type === 'diverging') {
      expect(options.divergingMidpoint).toBe('zero');
    } else {
      throw new Error('Expected diverging type options');
    }
  });

  // undefined/null プロパティの処理
  it('should handle undefined properties gracefully', () => {
    const config: MapVisualizationConfig = {
      colorSchemeType: 'sequential',
      colorScheme: undefined,
      minValueType: undefined,
      isReversed: undefined,
    };
    const options = mapConfigToColorOptions(config, mockData);
    expect(options).toEqual({
      type: 'sequential',
      data: mockData,
      colorScheme: 'interpolateBlues',
      minValueType: undefined, // undefinedはそのまま
      isReversed: undefined, // undefinedはそのまま
      noDataColor: '#e0e0e0',
    });
  });
});
