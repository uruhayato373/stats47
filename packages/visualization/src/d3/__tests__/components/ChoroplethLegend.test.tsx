import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ChoroplethLegend } from '../../components/ChoroplethLegend';
import { resolveChoroplethScale } from '../../utils/color-scale/resolve-choropleth-scale';

describe('ChoroplethLegend', () => {
  it('shows the specified bins and precise boundaries rather than colors sampled from regions', async () => {
    const scale = await resolveChoroplethScale(
      {
        colorSchemeType: 'sequential',
        colorScheme: 'interpolateBlues',
        classification: { method: 'equal-interval', classes: 5 },
      },
      [
        { areaCode: 'a', value: 0 },
        { areaCode: 'b', value: 1 },
      ]
    );
    const { container } = render(
      <ChoroplethLegend scale={scale} unit="指数" />
    );
    expect(screen.getByText('等間隔区分')).toBeTruthy();
    expect(screen.getByText('境界: 0.20 / 0.40 / 0.60 / 0.80 指数')).toBeTruthy();
    expect(container.querySelectorAll('span[title]')).toHaveLength(5);
  });
  it('includes the actual reference color when the reference is outside the observations', async () => {
    const scale = await resolveChoroplethScale(
      {
        colorSchemeType: 'diverging',
        colorScheme: 'interpolateRdBu',
        divergingMidpoint: 'custom',
        divergingMidpointValue: 100,
        classification: { method: 'equal-interval', classes: 5 },
      },
      [
        { areaCode: 'a', value: 73 },
        { areaCode: 'b', value: 82 },
      ]
    );
    const { container } = render(<ChoroplethLegend scale={scale} unit="%" />);
    expect(screen.getByText('基準: 100.00 %')).toBeTruthy();
    expect(container.textContent).toContain('100.00 %');
    expect(container.querySelectorAll('span[title]')).toHaveLength(5);
  });
});
