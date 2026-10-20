import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it, vi } from 'vitest';
import { SimpleLineChart } from '../components/charts/SimpleLineChart';
import { COLOR_SCHEMES } from '../themes/brand';
vi.mock('remotion',()=>({useCurrentFrame:()=>120,interpolate:()=>1}));
describe('Remotion shared numeric domain',()=>{
  const render=(data: {year:number;value:number|null}[], domainPolicy={mode:'extent'} as import('@stats47/types').NumericDomainPolicy)=>renderToStaticMarkup(createElement(SimpleLineChart,{data,domainPolicy,width:600,height:500,colors:COLOR_SCHEMES.light,animate:false}));
  it('keeps signed fixed limits and refuses clipped observations',()=>{
    const svg=render([{year:2020,value:-5},{year:2021,value:10}],{mode:'fixed',min:-10,max:20});
    expect(svg).toContain('>20</text>');expect(svg).toContain('>-10</text>');expect(svg).not.toContain('NaN');
    expect(()=>render([{year:2020,value:21}],{mode:'fixed',min:0,max:20})).toThrow('excludes');
  });
  it('breaks missing segments and emits no fabricated zero for empty data',()=>{
    const svg=render([{year:2020,value:10},{year:2021,value:15},{year:2022,value:null},{year:2023,value:20},{year:2024,value:25}]);
    expect(svg).not.toContain('NaN');expect(svg.match(/<circle /g)).toHaveLength(4);
    expect(svg).toMatch(/M[^"]+M/);
    expect(render([{year:2020,value:null}])).toBe('');
  });
});
