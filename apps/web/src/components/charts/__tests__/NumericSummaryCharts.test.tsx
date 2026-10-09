import {render} from '@testing-library/react';
import {describe,it,expect} from 'vitest';

import {NumericTrendChart} from '../NumericTrendChart';
import {ValueDotPlot} from '../ValueDotPlot';
describe('Numeric summary charts preserve scale meaning',()=>{
 it('spaces observations by calendar year and marks the selected observation',()=>{
  const {container}=render(<NumericTrendChart points={[{year:2020,value:10},{year:2021,value:11},{year:2024,value:15}]} policy={{mode:'extent'}} selectedYear={2021} label="平均" unit="時間" formatValue={String}/>);
  const svg=container.querySelector('svg')!;expect(svg.getAttribute('data-domain-min')).toBe('10');expect(svg.getAttribute('data-domain-max')).toBe('15');
  const marker=container.querySelector('[data-selected-year] circle')!;const lines=container.querySelectorAll('svg > g line');const first=Number(lines[0].getAttribute('x1')),last=Number(lines[0].getAttribute('x2'));expect((Number(marker.getAttribute('cx'))-first)/(last-first)).toBeCloseTo(.25);
 });
 it('signals observations outside a fixed display range instead of silently clipping values',()=>{
  const {container}=render(<NumericTrendChart points={[{year:2020,value:-1},{year:2021,value:2}]} policy={{mode:'fixed',min:0,max:1}} label="平均" unit="件" formatValue={String}/>);
  expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('表示範囲外: 2点');expect(container.textContent).toContain('▲');expect(container.textContent).toContain('▼');
 });
 it('uses value positions on an explicit cropped axis, including close ranked values',()=>{
  const {container}=render(<ValueDotPlot items={[{key:'a',rank:1,label:'A',value:102},{key:'b',rank:2,label:'B',value:101}]} values={[100,101,102]} reference={101} policy={{mode:'extent'}} formatValue={String}/>);
  expect(container.querySelector('[data-chart]')!.getAttribute('data-domain-min')).toBe('100');expect(container.textContent).toContain('破線: 単純平均 101');
  const dots=container.querySelectorAll('.bg-primary');expect((dots[0] as HTMLElement).style.left).toBe('100%');expect((dots[1] as HTMLElement).style.left).toBe('50%');
 });
});
