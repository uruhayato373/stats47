import { fetchPrefectures } from '@stats47/area';
import { PROPERTY_PRICE_DISTRIBUTION_SOURCE as SOURCE } from '@stats47/data-configs/theme-catalog';
import { z } from 'zod';

const prefectureNames = new Map(fetchPrefectures().map(p => [p.prefCode, p.prefName]));

const count = z.number().int().nonnegative();
const reasons = z.enum(['other-region','other-use','area-missing','area-censored','area-invalid','outside-area-band','unit-price-missing','unit-price-censored','unit-price-invalid','unit-price-nonpositive']);
const exclusions = z.record(reasons, count);
const distribution = z.object({
  count,
  status: z.enum(['available','small-sample','no-data']),
  q1:z.number().finite().positive().nullable(),
  median:z.number().finite().positive().nullable(),
  q3:z.number().finite().positive().nullable(),
  rawCount:count,
  excluded:exclusions,
}).strict();
const countyBase = distribution.extend({rawQualityFlags:z.record(z.string(),count)});
const transactionDistribution = countyBase.extend({quarterCounts:z.object({'1':count,'2':count,'3':count,'4':count}).strict()});
const schema = z.object({
  schemaVersion:z.literal(1),
  profileKey:z.literal('property-price-distribution'),
  generatedAt:z.string().datetime({offset:true}),
  year:z.literal('2025'),
  unit:z.literal('円/m2'),
  sourceManifestSha256:z.literal(SOURCE.sourceManifestSha256),
  definition:z.object({
    areaM2:z.object({minInclusive:z.literal(100),maxExclusive:z.literal(300)}).strict(),
    transactionType:z.literal('宅地(土地)'),
    transactionRegion:z.literal('住宅地'),
    priceClassification:z.literal('01'),
    transactionPeriod:z.object({from:z.literal('2025-Q1'),to:z.literal('2025-Q4')}).strict(),
    officialUseCode:z.literal('000'),
    officialPriceDate:z.literal('2025-01-01'),
    quantileMethod:z.literal(SOURCE.definition.quantileMethod),
    nationalAggregation:z.literal(SOURCE.definition.nationalAggregation),
  }).strict(),
  national:z.object({transactions:distribution,officialLandPrice:distribution}).strict(),
  areas:z.array(z.object({
    areaCode:z.string().regex(/^(?:0[1-9]|[1-3][0-9]|4[0-7])000$/),
    areaName:z.string().min(2),
    transactions:transactionDistribution,
    officialLandPrice:countyBase,
  }).strict()).length(47),
}).strict().superRefine((data,ctx)=>{
  const issue=(message:string)=>ctx.addIssue({code:z.ZodIssueCode.custom,message});
  if(new Set(data.areas.map(a=>a.areaCode)).size!==47)issue('Duplicate prefecture');
  for (const area of data.areas) if (prefectureNames.get(area.areaCode) !== area.areaName) issue('Prefecture code/name mismatch');
  for(const area of [data.national,...data.areas])for(const key of ['transactions','officialLandPrice'] as const){
    const d=area[key],q=[d.q1,d.median,d.q3];
    if(d.rawCount!==d.count+Object.values(d.excluded).reduce((a,n)=>a+n,0))issue('Raw row conservation failure');
    if(d.count===0){if(d.status!=='no-data'||q.some(n=>n!==null))issue('No observations require null quantiles');}
    else{if(q.some(n=>n===null))issue('Observed sample requires quantiles');if(d.q1!==null&&d.median!==null&&d.q3!==null&&!(d.q1<=d.median&&d.median<=d.q3))issue('Quartile order');if(d.status!==(d.count<10?'small-sample':'available'))issue('Sample status mismatch');}
  }
  for(const a of data.areas)if(Object.values(a.transactions.quarterCounts).reduce((a,n)=>a+n,0)!==a.transactions.count)issue('Quarter/sample denominator mismatch');
  for(const key of ['transactions','officialLandPrice'] as const){
    if(data.areas.reduce((n,a)=>n+a[key].count,0)!==data.national[key].count)issue('National sample count is not pooled');
    if(data.areas.reduce((n,a)=>n+a[key].rawCount,0)!==data.national[key].rawCount)issue('National raw count mismatch');
    const reasons=new Set([...Object.keys(data.national[key].excluded),...data.areas.flatMap(a=>Object.keys(a[key].excluded))]);
    for(const reason of reasons){const k=reason as keyof typeof data.national.transactions.excluded;if(data.areas.reduce((n,a)=>n+(a[key].excluded[k]??0),0)!==(data.national[key].excluded[k]??0))issue('National exclusions mismatch');}
  }
});
export type PropertyPriceDistributionSnapshot = z.infer<typeof schema>;
export type PropertyPriceDistribution = PropertyPriceDistributionSnapshot['national']['transactions'];
export function parsePropertyPriceDistributionSnapshot(value:unknown):PropertyPriceDistributionSnapshot{return schema.parse(value);}
