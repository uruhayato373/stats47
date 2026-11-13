// @vitest-environment node
import {describe,it,expect} from 'vitest';

import {formatRankingValue} from '../compute-ranking-header-stats';
import {resolveRankingPresentation,supportedRankingNormalization} from '../resolve-ranking-presentation';

import type {RankingItem} from '@stats47/ranking';
const item={title:'件数',unit:'件',valueDisplay:{conversionFactor:.001,displayUnit:'千件'},visualization:{colorScheme:'interpolateBlues',colorSchemeType:'sequential',classification:{method:'threshold',thresholds:[100,200]},domain:{mode:'fixed',min:0,max:1000},trendDomain:{mode:'fixed',min:0,max:1000},comparisonDomain:{mode:'extent'}},calculation:{normalizationOptions:[{type:'per_population',label:'人口10万人あたり',unit:'件/10万人',scaleFactor:100000,decimalPlaces:2}]}} as RankingItem;
describe('All ranking views use the selected observation units',()=>{
 it('keeps original metadata and resets raw-unit boundaries and display multipliers for normalized values',()=>{expect(resolveRankingPresentation(item,undefined)).toBe(item);const normalized=resolveRankingPresentation(item,'per_population');expect(normalized.unit).toBe('件/10万人');expect(normalized.valueDisplay?.conversionFactor).toBe(1);expect(normalized.visualization.domain?.mode).toBe('extent');expect(normalized.visualization.classification.method).toBe('equal-interval');});
 it('accepts only normalization options supported by the current metric',()=>{expect(supportedRankingNormalization(item,'per_population')).toBe('per_population');expect(supportedRankingNormalization(item,'not-supported')).toBeUndefined();expect(supportedRankingNormalization(item,'per_area')).toBeUndefined();});
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
