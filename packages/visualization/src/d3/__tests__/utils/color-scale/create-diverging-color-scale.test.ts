import { describe, expect, it } from 'vitest';
import * as d3 from 'd3';
import { createDivergingColorScale } from '@/d3/utils/color-scale/create-diverging-color-scale';
const data = [-10, 0, 10, 20, 30].map(value => ({value}));
describe('diverging palette adapter', () => {
  it('maps extrema and the declared reference consistently', async () => {
    const scale = await createDivergingColorScale({data, type:'diverging', divergingMidpoint:10, d3});
    expect(scale(-10)).toBe(d3.interpolateRdBu(0));
    expect(scale(10)).toBe(d3.interpolateRdBu(0.5));
    expect(scale(30)).toBe(d3.interpolateRdBu(1));
  });
  it('symmetrizes around zero and reverses exactly once', async () => {
    const scale = await createDivergingColorScale({data, type:'diverging', divergingMidpoint:'zero', isSymmetrized:true, isReversed:true, d3});
    expect(scale(-30)).toBe(d3.interpolateRdBu(1));
    expect(scale(0)).toBe(d3.interpolateRdBu(0.5));
    expect(scale(30)).toBe(d3.interpolateRdBu(0));
  });
  it('uses finite mean/median and handles empty input', async () => {
    for (const divergingMidpoint of ['mean','median'] as const) {
      const scale = await createDivergingColorScale({data, type:'diverging', divergingMidpoint, d3});
      expect(scale(10)).toBe(d3.interpolateRdBu(0.5));
    }
    const empty = await createDivergingColorScale({data:[], type:'diverging', divergingMidpoint:'zero', noDataColor:'#abc', d3});
    expect(empty(1)).toBe('#abc');
  });
});
