import { describe, expect, it } from 'vitest';
import { resolveColorEncoding } from '../color-encoding';
const color = (position: number) => String(position);
describe('numerical color encoding', () => {
  it('derives fills and legend from identical class boundaries', () => {
    const scale = resolveColorEncoding(
      {
        domain: { mode: 'fixed', min: 0, max: 100 },
        classification: { method: 'threshold', thresholds: [20, 50, 80] },
      },
      [5, 95],
      color,
      'missing'
    );
    expect(scale.boundaries).toEqual([0, 20, 50, 80, 100]);
    expect(scale.colorAtValue(20)).toBe(scale.colors[1]);
    expect(scale.colorAtValue(1000)).toBe(scale.colors[3]);
    expect(scale.colorAtValue(NaN)).toBe('missing');
  });
  it('handles a one-sided diverging sample and a declared center', () => {
    const scale = resolveColorEncoding(
      {
        colorSchemeType: 'diverging',
        divergingMidpoint: 'zero',
        isSymmetrized: true,
      },
      [10, 30],
      color,
      'missing'
    );
    expect(scale.domain).toEqual([-30, 30]);
    expect(scale.midpoint).toBe(0);
    expect(scale.colorAtValue(0)).toBe('0.5');
    expect(scale.colorAtValue(30)).toBe('1');
  });
  it('collapses tied quantile thresholds and reverses colors once', () => {
    const scale = resolveColorEncoding(
      { classification: { method: 'quantile', classes: 5 }, isReversed: true },
      [1, 1, 1, 1, 100],
      color,
      'missing'
    );
    expect(new Set(scale.boundaries).size).toBe(scale.boundaries.length);
    expect(Number(scale.colorAtValue(1))).toBeGreaterThan(
      Number(scale.colorAtValue(100))
    );
    expect(resolveColorEncoding({}, [], color, 'missing').domain).toBeNull();
  });
});
