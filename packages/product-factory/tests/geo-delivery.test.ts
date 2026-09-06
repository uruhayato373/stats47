import { describe, it, expect } from 'vitest';
import { buildLandPricePrefDetail, type GeoAnalysisSnapshot } from '@stats47/gis';
import { assertDeliveryDetail, buildDelivery, csv, pointRows } from '../src/channels/geo/delivery';
import { GEO_SERVICE_OFFER } from '../src/channels/geo/service-offer';
import { validateManifestInputs } from '../src/channels/geo/delivery-cli';
import type { GeoAnalysisEvidenceManifest } from '@stats47/gis';

function fixture() {
  const detail = buildLandPricePrefDetail({
    generatedAt: '2026-09-05T00:00:00Z', areaCode: '13000', areaName: '東京都',
    meshes: [{ meshId: '53394500', areaCode: '13000', longitude: 139.5, latitude: 35.5, bounds: [139,35,140,36], population2020: 100, population2050: 80 }],
    points: [
      { id: 'a', areaCode: '13000', longitude:139.5, latitude:35.5, price:100, change:2 },
      { id: 'b', areaCode: '13000', longitude:139.6, latitude:35.5, price:100, change:null },
      { id: 'c', areaCode: '13000', longitude:141, latitude:35.5, price:100, change:0 },
    ],
  });
  const aggregate: GeoAnalysisSnapshot = { schemaVersion:1, slug:'population-land-price', generatedAt:detail.generatedAt, dataVersion:'2020-2050', geography:'prefecture', title:'test', question:'test', primaryMetricKey:'risingDecliningPointShare', metrics:[], rows:[{areaCode:'13000',areaName:'東京都',rank:1,values:{...detail.summary,sampleCount:3}}],summary:{observationCount:1,medianValue:100,topAreaCodes:[],bottomAreaCodes:[]},method:[],sources:[],caveats:['将来価格を推定しない'],dataQuality:{expectedAreas:47,actualAreas:1,missingAreaCodes:[],inputCounts:{},coverageNote:'fixture'}};
  return {detail,aggregate};
}

describe('Geo service delivery, not a ranking repack', () => {
  it('retains spatial IDs, missing reasons and all geometry without duplicating mesh rows', () => {
    const {detail,aggregate}=fixture();
    expect(() => assertDeliveryDetail(detail,aggregate)).not.toThrow();
    const rows=pointRows(detail);
    expect(rows.map(r=>r.risingDeclining)).toEqual([true,null,null]);
    expect(rows.map(r=>r.exclusion)).toEqual([null,'missing_change','unmatched']);
    const files=buildDelivery(detail,aggregate);
    expect(files.get('points.csv')!.split('\r\n')).toHaveLength(5);
    expect(files.get('meshes.csv')!.split('\r\n')).toHaveLength(3);
    expect(files.get('map.svg')!.match(/<circle /g)).toHaveLength(3);
    expect(files.get('DATA-DICTIONARY.md')).toContain('人口列を合計してはいけません');
    expect(files.get('LICENSE-ja.txt')).toContain('CC BYデータ・著作権の生じない事実へ適用しません');
    expect(files.get('report.html')).toContain('未出品・需要確認待ち');
    expect(files.get('report.html')).toContain('/geo/population-land-price/13/overlap');
    expect(files.get('report.html')).not.toContain('/13/land-price-mesh-join');
    expect(GEO_SERVICE_OFFER.priceYen).toBe(5000);
    expect(GEO_SERVICE_OFFER.status).toBe('draft');
    expect(GEO_SERVICE_OFFER.deliveryBusinessDays).toBe(5);
    expect(GEO_SERVICE_OFFER.revisions).toBe(1);
    expect(GEO_SERVICE_OFFER.launchPolicy).toContain('価格承認・見本生成を需要確認とみなさない');
  });
  it('rejects dropped point-to-mesh lineage even when totals look correct', () => {
    const {detail,aggregate}=fixture();
    expect(()=>assertDeliveryDetail({...detail,pointMeshIds:[null,null,null]},aggregate)).toThrow('空間結合');
  });
  it('rejects changed denominator, duplicate geometry, and mismatched prefecture identity', () => {
    const {detail,aggregate}=fixture();
    expect(()=>assertDeliveryDetail({...detail,summary:{...detail.summary,comparablePointCount:99}},aggregate)).toThrow('conservation');
    expect(()=>assertDeliveryDetail({...detail,meshes:[...detail.meshes,...detail.meshes]},aggregate)).toThrow('duplicate');
    expect(()=>assertDeliveryDetail({...detail,areaName:'神奈川県'},aggregate)).toThrow('identity');
  });
  it('keeps numeric negatives numeric while escaping spreadsheet formulas in text', () => {
    expect(csv([['=HYPERLINK("bad")',-2,null]])).toBe('\uFEFF"\'=HYPERLINK(""bad"")","-2",""\r\n');
  });
  it('rejects a missing source, a context-only source and dataset misattribution', () => {
    const inputs: GeoAnalysisEvidenceManifest['inputs'] = [...Array.from({length:47},(_,i)=>({layerId:'population',datasetId:'mesh1000r6',version:'24',key:`gis/mlit-ksj/mesh1000r6/24/${String(i+1).padStart(2,'0')}.topojson`,sha256:'a'.repeat(64),bytes:100,geometry:'mesh' as const,role:'calculation-input' as const,usedInCalculation:true})),{layerId:'land',datasetId:'L01',version:'26',key:'gis/mlit-ksj/L01/26/national.topojson',sha256:'b'.repeat(64),bytes:100,geometry:'point',role:'calculation-input',usedInCalculation:true}];
    const manifest: GeoAnalysisEvidenceManifest = {schemaVersion:1,slug:'population-land-price',generatedAt:'2026-09-05',definitionSha256:'c'.repeat(64),inputs,stages:[{id:'land-price-mesh-join',kind:'spatial-operation',role:'derived',label:'join',inputIds:[],operation:'point-in-mesh',outputKeyPattern:'',outputs:[]}],aggregate:{key:'',sha256:'d'.repeat(64),bytes:100,recordCount:47},quality:{expectedAreas:47,detailAreas:47,conservationChecks:47,sourceRecords:100,derivedRecords:10,populatedMeshes:90,maxDetailBytes:100}};
    expect(()=>validateManifestInputs(manifest)).not.toThrow();
    expect(()=>validateManifestInputs({...manifest,inputs:inputs.slice(1)})).toThrow('input set');
    expect(()=>validateManifestInputs({...manifest,inputs:inputs.map((i,n)=>n===0?{...i,usedInCalculation:false}:i)})).toThrow('input contract');
    expect(()=>validateManifestInputs({...manifest,inputs:inputs.map((i,n)=>n===0?{...i,datasetId:'L01',version:'26'}:i)})).toThrow('input contract');
  });
});
