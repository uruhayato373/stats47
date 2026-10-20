import { describe, expect, it } from 'vitest';
import * as d3 from 'd3';
import { createSequentialColorScale } from '@/d3/utils/color-scale/create-sequential-color-scale';
const data = [10, 30, 50].map(value => ({value}));
describe('sequential palette adapter', () => {
  it('honors zero and observed-minimum policies without re-scaling', async () => {
    const zero = await createSequentialColorScale({data, type: 'sequential', minValueType: 'zero', d3});
    const extent = await createSequentialColorScale({data, type: 'sequential', minValueType: 'data-min', d3});
    expect(zero(10)).toBe(d3.interpolateBlues(0.2));
    expect(extent(10)).toBe(d3.interpolateBlues(0));
    expect(extent(30)).toBe(d3.interpolateBlues(0.5));
    expect(extent(100)).toBe(d3.interpolateBlues(1));
  });
  it('honors palette, reversal, resolved bounds, and missing observations', async () => {
    const scale = await createSequentialColorScale({data, type: 'sequential', colorScheme:'interpolateViridis', isReversed:true, resolvedDomain:[0,100], noDataColor:'#abc', d3});
    expect(scale(25)).toBe(d3.interpolateViridis(0.75));
    expect(scale(NaN)).toBe('#abc');
    const empty = await createSequentialColorScale({data:[], type:'sequential', noDataColor:'#abc', d3});
    expect(empty(1)).toBe('#abc');
  });
});
