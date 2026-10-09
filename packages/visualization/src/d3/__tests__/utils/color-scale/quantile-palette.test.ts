import { describe, expect, it } from 'vitest';
import { resolveChoroplethScale } from '../../../utils/color-scale/resolve-choropleth-scale';

const points = (values: number[]) => values.map((value, index) => ({ areaCode: String(index), value }));

describe('Quantile palette readability', () => {
  it('uses the same full class palette for balanced and strongly skewed observations', async () => {
    const config = {
      colorSchemeType: 'sequential' as const,
      colorScheme: 'interpolateBlues',
      classification: { method: 'quantile' as const, classes: 5 },
    };
    const balanced = await resolveChoroplethScale(config, points([0, 250, 500, 750, 1000]));
    const skewed = await resolveChoroplethScale(config, points([0, 1, 2, 3, 1000]));
    expect(skewed.boundaries).not.toEqual(balanced.boundaries);
    expect(skewed.colors).toEqual(balanced.colors);
    expect(new Set(skewed.colors).size).toBe(5);
    for (const [index, value] of [0, 1, 2, 3, 1000].entries())
      expect(skewed.colorAtValue(value)).toBe(skewed.colors[index]);
  });

  it('keeps the declared reference neutral while spreading ranks on each side', async () => {
    const config = {
      colorSchemeType: 'diverging' as const,
      colorScheme: 'interpolateRdBu',
      divergingMidpoint: 'custom' as const,
      divergingMidpointValue: 0,
      classification: { method: 'quantile' as const, classes: 5 },
    };
    const balanced = await resolveChoroplethScale(config, points([-100, -50, -1, 1, 50, 100]));
    const skewed = await resolveChoroplethScale(config, points([-100, -10, -1, 1, 10, 100]));
    expect(skewed.colors).toEqual(balanced.colors);
    expect(skewed.colorAtValue(0)).toBe(skewed.colors[2]);
    expect(new Set(skewed.colors).size).toBe(5);
  });
});
