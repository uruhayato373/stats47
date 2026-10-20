import { describe, expect, it } from 'vitest';
import { interpolateBlues } from 'd3';
import { createChoroplethColorMapper } from '@/d3/utils/color-scale/create-choropleth-color-mapper';
describe('map area lookup', () => {
  it('uses shared numerical colors and explicit no-data color', async () => {
    const mapper = await createChoroplethColorMapper({colorSchemeType:'sequential', domain:{mode:'extent'}, noDataColor:'#abc'}, [10,20,30].map((value,i)=>({areaCode:String(i+1),value})));
    expect(mapper('1')).toBe(interpolateBlues(0));
    expect(mapper('2')).toBe(interpolateBlues(0.5));
    expect(mapper('3')).toBe(interpolateBlues(1));
    expect(mapper('99')).toBe('#abc');
  });
});
