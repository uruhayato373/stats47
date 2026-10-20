import { describe, expect, it } from 'vitest';
import { calculateMidpoint } from '@/d3/utils/color-scale/calculate-midpoint';
const rows = (values: number[]) => values.map(value => ({value}));
describe('shared midpoint compatibility entry', () => {
  it('preserves explicit references', () => {
    expect(calculateMidpoint([], 'zero', undefined)).toBe(0);
    expect(calculateMidpoint([], 25, undefined)).toBe(25);
    expect(calculateMidpoint([], 'custom', -3)).toBe(-3);
  });
  it('summarizes only finite observations', () => {
    expect(calculateMidpoint(rows([10, NaN, 20, Infinity, 90]), 'mean', undefined)).toBe(40);
    expect(calculateMidpoint(rows([10, NaN, 20, Infinity, 90]), 'median', undefined)).toBe(20);
    expect(calculateMidpoint(rows([10, 20]), 'median', undefined)).toBe(15);
  });
  it('rejects a missing custom reference or empty statistical reference', () => {
    expect(() => calculateMidpoint([], 'custom', undefined)).toThrow('midpoint');
    expect(() => calculateMidpoint([], 'mean', undefined)).toThrow('midpoint');
    expect(() => calculateMidpoint([], Infinity, undefined)).toThrow('midpoint');
  });
});
