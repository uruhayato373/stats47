import { describe, expect, it } from 'vitest';
import { resolveChoroplethScale } from '../../../d3/utils/color-scale/resolve-choropleth-scale';
import { createChoroplethColorMapper } from '../../../d3/utils/color-scale/create-choropleth-color-mapper';
import type { MapVisualizationConfig } from '../../../d3/types/map-chart';
const data = (values: number[]) => values.map((value, index) => ({ areaCode: String(index), value }));
const sequential: MapVisualizationConfig = { colorScheme: 'interpolateBlues', colorSchemeType: 'sequential', minValueType: 'data-min', classification: { method: 'equal-interval', classes: 5 } };
describe('Choropleth fills and legends share value-based scales', () => {
 it('honors extent and uses identical colors for each mapped area and legend bin', async () => {
  const rows=data([50, 10, 30]);const scale=await resolveChoroplethScale(sequential,rows);const map=await createChoroplethColorMapper(sequential,rows);
  expect(scale.domain).toEqual([10,50]);expect(scale.boundaries).toEqual([10,18,26,34,42,50]);
  for (const row of rows) expect(map(row.areaCode)).toBe(scale.colorAtValue(row.value));
  expect(map('missing')).toBe(scale.noDataColor);
 });
 it('quantiles deduplicate tied boundaries and preserve missing values', async () => {
  const scale=await resolveChoroplethScale({...sequential,classification:{method:'quantile',classes:5}},data([0,0,0,10,10]));
  expect(scale.boundaries).toHaveLength(3); expect(scale.boundaries[1]).toBeCloseTo(4);expect(scale.colorAtValue(NaN)).toBe(scale.noDataColor);
 });
 it('threshold boundaries assign a value on the boundary to the next class', async () => {
  const scale=await resolveChoroplethScale({...sequential,classification:{method:'threshold',thresholds:[20,40]}},data([0,50]));
  expect(scale.colorAtValue(19.99)).toBe(scale.colors[0]);expect(scale.colorAtValue(20)).toBe(scale.colors[1]);expect(scale.colorAtValue(40)).toBe(scale.colors[2]);
 });
 it('keeps authored intervals and uses a neutral bin when the reference is inside it', async () => {
  const config: MapVisualizationConfig={colorScheme:'interpolateRdBu',colorSchemeType:'diverging',divergingMidpoint:'zero',classification:{method:'equal-interval',classes:5}};
  const scale=await resolveChoroplethScale(config,data([-1,0,1,100]));
  expect(scale.boundaries).toHaveLength(6);expect(scale.colors).toHaveLength(5);expect(scale.boundaries[1]-scale.boundaries[0]).toBeCloseTo(20.2);expect(scale.colorAtValue(-1)).toBe(scale.colorAtValue(0));expect(scale.colorAtValue(100)).not.toBe(scale.colorAtValue(0));
  const specified=await resolveChoroplethScale({...config,classification:{method:'threshold',thresholds:[20,40]}},data([-1,100]));expect(specified.boundaries).toEqual([-1,20,40,100]);
 });
 it('holds fixed domains and rejects incompatible diverging references', async () => {
  const fixed=await resolveChoroplethScale({...sequential,domain:{mode:'fixed',min:0,max:100}},data([20,50]));expect(fixed.domain).toEqual([0,100]);
  await expect(resolveChoroplethScale({colorScheme:'interpolateRdBu',colorSchemeType:'diverging',domain:{mode:'fixed',min:1,max:10}},data([2,3]))).rejects.toThrow('excludes midpoint');
 });
 it('handles constant, zero, negative and nonfinite observations', async () => {
  expect((await resolveChoroplethScale(sequential,data([5,5]))).domain).toEqual([4.5,5.5]);
  expect((await resolveChoroplethScale({...sequential,minValueType:'zero'},data([0,0]))).domain).toEqual([0,1]);
  expect((await resolveChoroplethScale(sequential,data([-10,5]))).domain).toEqual([-10,5]);
  expect((await resolveChoroplethScale(sequential,data([NaN]))).domain).toBeNull();
 });
});
