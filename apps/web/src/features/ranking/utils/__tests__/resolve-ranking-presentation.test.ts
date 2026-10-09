import {describe,it,expect} from 'vitest';

import {resolveRankingPresentation,supportedRankingNormalization} from '../resolve-ranking-presentation';

import type {RankingItem} from '@stats47/ranking';
const item={title:'件数',unit:'件',valueDisplay:{conversionFactor:.001,displayUnit:'千件'},visualization:{colorScheme:'interpolateBlues',colorSchemeType:'sequential',classification:{method:'threshold',thresholds:[100,200]},domain:{mode:'fixed',min:0,max:1000},trendDomain:{mode:'fixed',min:0,max:1000},comparisonDomain:{mode:'extent'}},calculation:{normalizationOptions:[{type:'per_population',label:'人口10万人あたり',unit:'件/10万人',scaleFactor:100000,decimalPlaces:2}]}} as RankingItem;
describe('All ranking views use the selected observation units',()=>{
 it('keeps original metadata and resets raw-unit boundaries and display multipliers for normalized values',()=>{expect(resolveRankingPresentation(item,undefined)).toBe(item);const normalized=resolveRankingPresentation(item,'per_population');expect(normalized.unit).toBe('件/10万人');expect(normalized.valueDisplay?.conversionFactor).toBe(1);expect(normalized.visualization.domain?.mode).toBe('extent');expect(normalized.visualization.classification.method).toBe('equal-interval');});
 it('accepts only normalization options supported by the current metric',()=>{expect(supportedRankingNormalization(item,'per_population')).toBe('per_population');expect(supportedRankingNormalization(item,'not-supported')).toBeUndefined();expect(supportedRankingNormalization(item,'per_area')).toBeUndefined();});
});
