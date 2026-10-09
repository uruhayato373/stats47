import { describe, it, expect } from 'vitest';
import { createLegendFormatter } from '../../../utils/color-scale/legend-format';
describe('Readable legend boundaries', () => {
  it('preserves decimal thresholds even when integer rounding would not collide', () => {
    const fmt = createLegendFormatter([0.1, 2.1, 4.1]);
    expect([0.1, 2.1, 4.1].map(fmt)).toEqual(['0.1', '2.1', '4.1']);
  });
  it('does not print floating-point noise from calculated intervals', () => {
    const fmt = createLegendFormatter([0.1 + 0.2, 0.5]);
    expect(fmt(0.1 + 0.2)).toBe('0.3');
  });
  it('distinguishes integer-metric boundaries without changing observations', () => {
    const fmt = createLegendFormatter([0, 0.2, 0.4, 0.6, 0.8, 1], 1, 0);
    expect([0.2, 0.4, 0.6, 0.8].map(fmt)).toEqual(['0.2', '0.4', '0.6', '0.8']);
  });
  it('uses converted units and distinguishes close thresholds', () => {
    const fmt = createLegendFormatter([1000, 1001, 1002], 0.001, 1);
    expect([1000, 1001, 1002].map(fmt)).toEqual(['1.000', '1.001', '1.002']);
  });
  it('keeps the same precision for integral and decimal boundaries', () => {
    const fmt = createLegendFormatter([44, 60.4]);
    expect([44, 60.4].map(fmt)).toEqual(['44.0', '60.4']);
  });
});
