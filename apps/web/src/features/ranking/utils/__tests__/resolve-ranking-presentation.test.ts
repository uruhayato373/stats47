// @vitest-environment node
import {resolveRankingValueDisplay, type RankingItem} from '@stats47/ranking';
import {describe,it,expect} from 'vitest';

import {formatRankingValue} from '../compute-ranking-header-stats';
import {resolveRankingPresentation,supportedRankingNormalization} from '../resolve-ranking-presentation';
const item={title:'件数',unit:'件',valueDisplay:{conversionFactor:.001,displayUnit:'千件'},visualization:{colorScheme:'interpolateBlues',colorSchemeType:'sequential',classification:{method:'threshold',thresholds:[100,200]},domain:{mode:'fixed',min:0,max:1000},trendDomain:{mode:'fixed',min:0,max:1000},comparisonDomain:{mode:'extent'}},calculation:{normalizationOptions:[{type:'per_population',label:'人口10万人あたり',unit:'件/10万人',scaleFactor:100000,decimalPlaces:2}]}} as RankingItem;
describe('All ranking views use the selected observation units',()=>{
 it('keeps original metadata and resets raw-unit boundaries and display multipliers for normalized values',()=>{expect(resolveRankingPresentation(item,undefined)).toBe(item);const normalized=resolveRankingPresentation(item,'per_population');expect(normalized.unit).toBe('件/10万人');expect(normalized.valueDisplay?.conversionFactor).toBe(1);expect(normalized.visualization.domain?.mode).toBe('extent');expect(normalized.visualization.classification.method).toBe('equal-interval');});
 it('accepts only normalization options supported by the current metric',()=>{expect(supportedRankingNormalization(item,'per_population')).toBe('per_population');expect(supportedRankingNormalization(item,'not-supported')).toBeUndefined();expect(supportedRankingNormalization(item,'per_area')).toBeUndefined();});
});

// 2026-11-25: 分母が人口・面積でない見方は、別の指標の公表値をそのまま出す選択肢 (series) として同じ 1 列に並べる
const withSeries={...item,title:'製造品出荷額等',calculation:{normalizationOptions:[...(item.calculation?.normalizationOptions??[]),{type:'series',metric:'manufacturing-shipment-amount-per-employee',label:'従業者1人当たり',unit:'万円',valueDisplay:{conversionFactor:1,decimalPlaces:1},visualization:{colorScheme:'interpolateGreens',colorSchemeType:'sequential',classification:{method:'equal-interval'},domain:{mode:'extent'},trendDomain:{mode:'extent'},comparisonDomain:{mode:'extent'}}}]}} as RankingItem;
describe('A series view shows another metric\'s published values with that metric\'s unit and precision',()=>{
 it('is selected by the metric key and takes the unit, digits and colours baked from that metric',()=>{const v=resolveRankingPresentation(withSeries,'manufacturing-shipment-amount-per-employee');expect(v.title).toBe('製造品出荷額等（従業者1人当たり）');expect(v.unit).toBe('万円');expect(v.valueDisplay?.decimalPlaces).toBe(1);expect(v.visualization.colorScheme).toBe('interpolateGreens');});
 it('accepts a series key only when the metric lists it (the key is never taken from the URL as is)',()=>{expect(supportedRankingNormalization(withSeries,'manufacturing-shipment-amount-per-employee')).toBe('manufacturing-shipment-amount-per-employee');expect(supportedRankingNormalization(withSeries,'total-population')).toBeUndefined();});
});

describe('Ranking values are written in the display unit the page resolved', () => {
 it('multiplies by the factor only when writing (可処分所得 639,356 円 → 63.9 万円, 事業税 → 15,450 億円)', () => {
  expect(formatRankingValue(639_356, 1, 0.0001)).toBe('63.9');
  expect(formatRankingValue(1_544_976_077, 0, 0.00001)).toBe('15,450');
 });
 it('writes a non-zero value that rounds to zero as 「未満」 instead of hiding the prefecture', () => {
  expect(formatRankingValue(40, 1, 0.001)).toBe('0.1未満');
  expect(formatRankingValue(0, 1, 0.001)).toBe('0.0');
 });
 it('formats unconverted values exactly as before', () => {
  expect(formatRankingValue(60.42, 2)).toBe('60.42');
  expect(formatRankingValue(1234.5)).toBe('1,234.5');
 });
});

// 2026-11-27: 見方を選んだとき、ページは表示の桁を null で渡していて、選択肢の桁 1 の指標でも表と上位・下位が 2 桁で出ていた
describe('A normalized view writes values with the precision of the selected option', () => {
 it('resolves the display from the presented item: no conversion, the option decimals and unit', () => {
  const oneDecimal = {...item, calculation: {normalizationOptions: [{...item.calculation!.normalizationOptions![0], decimalPlaces: 1}]}} as RankingItem;
  const display = resolveRankingValueDisplay(resolveRankingPresentation(oneDecimal, 'per_population'), [912_032.06, 687_779.6]);
  expect(display).toEqual({unit: '件/10万人', factor: 1, precision: 1});
 });
});
