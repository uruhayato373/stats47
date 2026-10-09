import {describe,it,expect} from 'vitest';
import {METRICS_REGISTRY} from '../registry';
import {buildRecipe} from '../recipe';
import {metricDependencies,metricNormalizationDependencies,metricSourceReferences} from '../metric-linkage';
describe('Metric source and consumer linkage',()=>{
 it('includes table coordinates for every household recipe',()=>{const metrics=Object.values(METRICS_REGISTRY).filter(metric=>metric.source.kind==='kakei-chousa');expect(metrics.length).toBeGreaterThan(700);for(const metric of metrics){const primary=metricSourceReferences(metric).find(ref=>ref.role==='primary');expect(primary?.statsDataId,metric.key).toBe(buildRecipe(metric).estatParams?.statsDataId);const params=buildRecipe(metric).estatParams!;for(const coordinate of ['cdTab','cdCat01','cdCat02','cdCat03','cdCat04','cdCat05'] as const) if(params[coordinate]) expect(primary?.filters[coordinate],metric.key).toBe(params[coordinate]);}});
 it('separates normalization inputs from computed metric cycles and uses registered denominators',()=>{expect(metricDependencies(METRICS_REGISTRY['total-population'])).toEqual([]);expect(metricNormalizationDependencies(METRICS_REGISTRY['total-population'])).toEqual(['total-area-including-northern-territories-and-takeshima']);});
 it('retains every metric exactly once in bounded reverse-index shards', async()=>{
   const fs=await import('node:fs'); const path=await import('node:path');
   const directory=path.resolve(__dirname,'../../../../data/metrics/index');
   const shards=fs.readdirSync(directory).filter(name=>/^linkage-\d{3}\.json$/.test(name)).sort();
   expect(shards.length).toBeGreaterThan(1);
   const keys=shards.flatMap(name=>{
     const file=path.join(directory,name); expect(fs.statSync(file).size).toBeLessThanOrEqual(1_048_576);
     const shard=JSON.parse(fs.readFileSync(file,'utf8')) as {version:number;entries:{metricKey:string}[]};
     expect(shard.version).toBe(1); expect(shard.entries.length).toBeLessThanOrEqual(100);
     return shard.entries.map(entry=>entry.metricKey);
   });
   expect(keys).toEqual(Object.keys(METRICS_REGISTRY).sort());
   expect(new Set(keys).size).toBe(keys.length);
   expect(fs.existsSync(path.join(directory,'linkage.json'))).toBe(false);
 });
});
