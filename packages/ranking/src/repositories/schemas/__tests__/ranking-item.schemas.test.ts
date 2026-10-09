import {describe,it,expect} from 'vitest';
import {METRICS_REGISTRY} from '@stats47/data-configs';
import {buildRankingItemFromMetric} from '../../../builders/build-ranking-item-from-metric';
import {parseRankingItemSnapshot} from '../ranking-item.schemas';
const snapshot={generatedAt:'2026-10-09T00:00:00.000Z',item:buildRankingItemFromMetric(METRICS_REGISTRY['total-population'],{now:'2026-10-09T00:00:00.000Z',values:null})};
describe('Ranking snapshots use canonical metric metadata',()=>{
 it('reads current builder output without dropping its presentation or source recipe',()=>{const parsed=parseRankingItemSnapshot(JSON.parse(JSON.stringify(snapshot)));expect(parsed.item.visualization).toEqual(snapshot.item.visualization);expect(parsed.item.sourceConfig?.recipe).toEqual(snapshot.item.sourceConfig?.recipe);});
 it('rejects missing presentation and duplicated legacy source coordinates',()=>{expect(()=>parseRankingItemSnapshot({...snapshot,item:{...snapshot.item,visualization:undefined}})).toThrow();expect(()=>parseRankingItemSnapshot({...snapshot,item:{...snapshot.item,sourceConfig:{...snapshot.item.sourceConfig,statsDataId:'0000000000'}}})).toThrow('canonical recipe');});
 it('rejects invalid domains and unsupported color schemes',()=>{expect(()=>parseRankingItemSnapshot({...snapshot,item:{...snapshot.item,visualization:{...snapshot.item.visualization,domain:{mode:'fixed',min:100,max:0}}}})).toThrow();expect(()=>parseRankingItemSnapshot({...snapshot,item:{...snapshot.item,visualization:{...snapshot.item.visualization,colorScheme:'Nope'}}})).toThrow();});
});
