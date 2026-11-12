import {fireEvent, render, screen} from '@testing-library/react';
import {describe,it,expect} from 'vitest';

import {NumericTrendChart} from '../NumericTrendChart';
import {ValueDotPlot} from '../ValueDotPlot';
describe('Numeric summary charts preserve scale meaning',()=>{
 it('omits axis labels and exposes exact fiscal-year values by pointer and keyboard',()=>{
  const points = [{year:2020,value:10},{year:2021,value:11},{year:2024,value:15}];
  const {container,rerender}=render(<NumericTrendChart points={points} policy={{mode:'extent'}} selectedYear={2021} label="単純平均" unit="時間" formatValue={String} formatYear={(year)=>`${year}年度`} showAxes={false}/>);
  expect(container.querySelectorAll('svg text')).toHaveLength(0);
  const slider=screen.getByRole('slider');
  fireEvent.focus(slider);
  const tooltip=document.getElementById('prefecture-map-tooltip')!;
  expect(tooltip.textContent).toContain('2021年度');
  expect(tooltip.textContent).toContain('11');
  fireEvent.keyDown(slider,{key:'ArrowRight'});
  expect(slider.getAttribute('aria-valuenow')).toBe('2024');
  expect(tooltip.textContent).toContain('15');
  fireEvent(container.querySelector('svg')!,new MouseEvent('pointermove',{bubbles:true,clientX:12,clientY:40}));
  expect(tooltip.textContent).toContain('2020年度');
  expect(tooltip.style.opacity).toBe('1');
  rerender(<NumericTrendChart points={[{year:2020,value:1},{year:2024,value:2}]} policy={{mode:'extent'}} label="単純平均" unit="件" formatValue={String} showAxes={false}/>);
  expect(tooltip.style.opacity).toBe('0');
 });
 it('draws total as an area and mean as a line on one zero-inclusive value scale',()=>{
  const {container}=render(<NumericTrendChart points={[{year:2020,value:10},{year:2024,value:20}]} areaSeries={{label:'合計',color:'hsl(var(--chart-1))',points:[{year:2020,value:470},{year:2024,value:940}]}} policy={{mode:'extent'}} selectedYear={2024} label="単純平均" unit="人" formatValue={String} showAxes={false}/>);
  expect(container.querySelector('[data-series="total"]')).not.toBeNull();
  expect(container.querySelector('svg')!.getAttribute('data-domain-min')).toBe('0');
  expect(container.querySelector('svg')!.getAttribute('data-domain-max')).toBe('940');
  fireEvent.focus(screen.getByRole('slider'));
  const tooltip=document.getElementById('prefecture-map-tooltip')!;
  expect(tooltip.textContent).toContain('合計');
  expect(tooltip.textContent).toContain('940');
  expect(tooltip.textContent).toContain('単純平均');
  expect(tooltip.textContent).toContain('20');
 });
 it('does not bridge missing totals and preserves explicit fixed bounds for both series',()=>{
  const points=[{year:2020,value:.2},{year:2021,value:.4},{year:2024,value:.8}];
  const {container}=render(<NumericTrendChart points={points} areaSeries={{label:'合計',color:'hsl(var(--chart-1))',points:[{year:2020,value:.5},{year:2021,value:NaN},{year:2024,value:2}]}} policy={{mode:'fixed',min:0,max:1}} label="平均" unit="件" formatValue={String}/>);
  expect(container.querySelector('[data-series="total"]')!.getAttribute('d')!.match(/M/g)).toHaveLength(2);
  expect(container.querySelector('svg')!.getAttribute('data-domain-max')).toBe('1');
  expect(container.querySelector('svg')!.getAttribute('aria-label')).toContain('表示範囲外: 1点');
 });
 it('uses independent scales so the mean spans the chart and shows markers only during interaction',()=>{
  const {container}=render(<NumericTrendChart points={[{year:2020,value:10},{year:2024,value:20}]} areaSeries={{label:'合計',color:'hsl(var(--chart-1))',points:[{year:2020,value:470},{year:2024,value:940}],domainPolicy:{mode:'zero'}}} policy={{mode:'extent'}} label="平均" unit="人" formatValue={String} showAxes={false}/>);
  const svg=container.querySelector('svg')!;
  expect(svg.getAttribute('data-domain-min')).toBe('10');
  expect(svg.getAttribute('data-domain-max')).toBe('20');
  expect(svg.getAttribute('data-area-domain-min')).toBe('0');
  expect(svg.getAttribute('data-area-domain-max')).toBe('940');
  expect(container.querySelector('[data-series="total-outline"]')!.getAttribute('d')).not.toContain('Z');
  expect(svg.getAttribute('aria-label')).toContain('別の縦軸スケール');
  expect(container.querySelector('[data-selected-year]')).toBeNull();
  expect(container.querySelectorAll('circle')).toHaveLength(0);
  const slider=screen.getByRole('slider');
  fireEvent.focus(slider);
  fireEvent.keyDown(slider,{key:'Home'});
  const firstY=Number(container.querySelector('[data-hover-year] circle')!.getAttribute('cy'));
  fireEvent.keyDown(slider,{key:'End'});
  const lastY=Number(container.querySelector('[data-hover-year] circle')!.getAttribute('cy'));
  expect(firstY-lastY).toBeGreaterThan(80);
  const circles=container.querySelectorAll('[data-hover-year] circle');
  expect(circles[1].getAttribute('cy')).not.toBe(circles[0].getAttribute('cy'));
  expect(document.getElementById('prefecture-map-tooltip')!.textContent).toContain('940');
  fireEvent.pointerLeave(svg);
  expect(container.querySelectorAll('circle')).toHaveLength(0);
 });
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
  expect(container.querySelector('[data-chart]')!.getAttribute('data-domain-min')).toBe('100');expect(container.querySelector('[data-reference]')!.getAttribute('title')).toBe('単純平均: 101');
  expect(container.querySelector('p')).toBeNull();
  const dots=container.querySelectorAll('.bg-primary');expect((dots[0] as HTMLElement).style.left).toBe('100%');expect((dots[1] as HTMLElement).style.left).toBe('50%');
 });
});
