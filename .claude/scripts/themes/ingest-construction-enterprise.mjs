import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs } from 'node:util';
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const { extractYearCode } = require('../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (v) => createHash('sha256').update(v).digest('hex');
const SOURCES = [
  {
    "group": "construction",
    "file": "construction-data.json",
    "endpoint": "getStatsData",
    "parameters": {
      "statsDataId": "0003450610",
      "cdTab": "2020_05",
      "cdCat01": "0,1,2",
      "cdCat02": "00,01,02,03,04,05,06,07,08,09,10,11,12,13,14,15,16,17,18",
      "cdCat03": "D",
      "cdCat04": "0",
      "cdTime": "2020000000",
      "limit": "100000"
    },
    "sha256": "f6234108b48f52774f6c721565845c3f923acc4190e8a1f4d0bc99f2136b3e3a",
    "statisticalDataSha256": "1c5c5a99e4dcae5a47882a683dd7fb4165fc762c18a1f110ce5ccfea04412a41",
    "bytes": 780905,
    "tableUrl": "https://www.e-stat.go.jp/dbview?sid=0003450610",
    "statsDataId": "0003450610",
    "surveyDate": 202010,
    "updatedAt": "2026-05-29"
  },
  {
    "group": "enterprise",
    "file": "enterprise-data.json",
    "endpoint": "getStatsData",
    "parameters": {
      "statsDataId": "0004006264",
      "cdTab": "201-2021,211-2021",
      "cdCat01": "CR",
      "cdCat02": "00,01,02,03,04,05,06,07,08,09,10,11,R1,R2",
      "cdCat03": "11,2",
      "limit": "100000"
    },
    "sha256": "81ea937f640eb3bed84929485e7f43e0066354567ffe42d3018c9b40b7d58060",
    "statisticalDataSha256": "ed12c06830990927fda16b59e07361116d2efc5fd48ab559b54b74d40d889cd3",
    "bytes": 523984,
    "tableUrl": "https://www.e-stat.go.jp/dbview?sid=0004006264",
    "statsDataId": "0004006264",
    "surveyDate": 202106,
    "updatedAt": "2026-01-16"
  }
];

const KEYS = {
  construction: ['construction-employed-residents', 'construction-employed-under30', 'construction-employed-age30to54', 'construction-employed-age55plus', 'construction-employed-female'],
  enterprise: ['nonprimary-enterprises-count', 'nonprimary-enterprises-under5-count', 'nonprimary-enterprises-employees', 'nonprimary-enterprises-under5-employees'],
};
const EXPECTED_SOURCES = {
  "construction-employed-residents": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "0",
    "cdCat02": "00",
    "cdCat03": "D",
    "cdCat04": "0"
  },
  "construction-employed-under30": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "0",
    "cdCat03": "D",
    "cdCat04": "0",
    "axisSum": {
      "axis": "cat02",
      "codes": [
        "01",
        "02",
        "03"
      ]
    }
  },
  "construction-employed-age30to54": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "0",
    "cdCat03": "D",
    "cdCat04": "0",
    "axisSum": {
      "axis": "cat02",
      "codes": [
        "04",
        "05",
        "06",
        "07",
        "08"
      ]
    }
  },
  "construction-employed-age55plus": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "0",
    "cdCat03": "D",
    "cdCat04": "0",
    "axisSum": {
      "axis": "cat02",
      "codes": [
        "09",
        "10",
        "11",
        "12",
        "13",
        "14",
        "15",
        "16",
        "17",
        "18"
      ]
    }
  },
  "construction-employed-female": {
    "kind": "estat",
    "statsDataId": "0003450610",
    "cdTab": "2020_05",
    "cdCat01": "2",
    "cdCat02": "00",
    "cdCat03": "D",
    "cdCat04": "0"
  },
  "nonprimary-enterprises-count": {
    "kind": "estat",
    "statsDataId": "0004006264",
    "cdTab": "201-2021",
    "cdCat01": "CR",
    "cdCat02": "00",
    "axisSum": {
      "axis": "cat03",
      "codes": [
        "11",
        "2"
      ]
    }
  },
  "nonprimary-enterprises-under5-count": {
    "kind": "estat",
    "statsDataId": "0004006264",
    "cdTab": "201-2021",
    "cdCat01": "CR",
    "cdCat02": "01",
    "axisSum": {
      "axis": "cat03",
      "codes": [
        "11",
        "2"
      ]
    }
  },
  "nonprimary-enterprises-employees": {
    "kind": "estat",
    "statsDataId": "0004006264",
    "cdTab": "211-2021",
    "cdCat01": "CR",
    "cdCat02": "00",
    "axisSum": {
      "axis": "cat03",
      "codes": [
        "11",
        "2"
      ]
    }
  },
  "nonprimary-enterprises-under5-employees": {
    "kind": "estat",
    "statsDataId": "0004006264",
    "cdTab": "211-2021",
    "cdCat01": "CR",
    "cdCat02": "01",
    "axisSum": {
      "axis": "cat03",
      "codes": [
        "11",
        "2"
      ]
    }
  }
};
const SOURCE_FIELDS = ["kind", "statsDataId", "cdTab", "cdCat01", "cdCat02", "cdCat03", "cdCat04", "axisSum"];
const pad = (n) => String(n).padStart(2, '0');
const areas = ['00000', ...prefectures.map(p => p.prefCode)];
const array = (value) => Array.isArray(value) ? value : [value];
export function validateSource(data, group) {
  const source = SOURCES.find(s => s.group === group);
  assert.ok(source, 'unknown source');
  assert.equal(data.TABLE_INF['@id'], source.statsDataId);
  assert.equal(data.TABLE_INF.SURVEY_DATE, source.surveyDate);
  const classes = new Map(array(data.CLASS_INF.CLASS_OBJ).map(x => [x['@id'], new Map(array(x.CLASS).map(c => [c['@code'], c['@name']]))]));
  for (const p of prefectures) assert.equal(classes.get('area')?.get(p.prefCode), p.prefName, 'geographic code/name mismatch');
  assert.equal(classes.get('area').get('00000'), '全国');
  if (group === 'construction') {
    assert.equal(classes.get('cat03').get('D'), '建設業');
    assert.equal(classes.get('cat01').get('2'), '女');
    assert.equal(classes.get('cat04').get('0'), '総数');
    assert.equal(classes.get('cat02').get('01'), '15～19歳');
    assert.equal(classes.get('cat02').get('09'), '55～59歳');
  } else {
    assert.equal(classes.get('cat01').get('CR'), '非農林漁業（S_公務を除く）');
    assert.equal(classes.get('cat02').get('01'), '0～4人');
    assert.equal(classes.get('cat03').get('11'), '会社企業');
    assert.equal(classes.get('cat03').get('2'), '個人');
  }
  const rows = array(data.DATA_INF.VALUE);
  assert.equal(Number(data.RESULT_INF.TOTAL_NUMBER), rows.length, 'partial API response');
  const indexes = new Map(); let structuralZeros = 0;
  for (const r of rows) {
    assert.equal(extractYearCode(r['@time']), group === 'construction' ? '2020' : '2021');
    if (group === 'construction') {
      assert.equal(r['@tab'], '2020_05'); assert.equal(r['@cat03'], 'D'); assert.equal(r['@cat04'], '0');
      assert.ok(['0','1','2'].includes(r['@cat01'])); assert.ok(Array.from({length:19}, (_,i) => pad(i)).includes(r['@cat02']));
    } else {
      assert.ok(['201-2021','211-2021'].includes(r['@tab'])); assert.equal(r['@cat01'], 'CR'); assert.ok(['11','2'].includes(r['@cat03']));
      assert.ok([...Array.from({length:12}, (_,i) => pad(i)), 'R1','R2'].includes(r['@cat02']));
    }
    assert.equal(r['@unit'], r['@tab'] === '201-2021' ? '企業等' : '人');
    // Both selected tabs are nonnegative counts. '-' means no corresponding count;
    // no ratio, suppressed X/*** or omitted coordinate is converted into zero.
    if (r.$ === '-') structuralZeros++;
    assert.ok(/^\d+$/.test(r.$) || r.$ === '-', 'suppression/invalid count');
    const value = r.$ === '-' ? 0 : Number(r.$); assert.ok(Number.isSafeInteger(value));
    const coord = group === 'construction' ? [r['@area'],r['@cat01'],r['@cat02']] : [r['@area'],r['@tab'],r['@cat02'],r['@cat03']];
    const key = coord.join('|'); assert.ok(!indexes.has(key), 'duplicate source coordinate'); indexes.set(key, value);
  }
  const get = (...coord) => { const value = indexes.get(coord.join('|')); assert.notEqual(value, undefined, 'missing source coordinate'); return value; };
  const checks = { agePartitions: 0, sexPartitions: 0, sizePartitions: 0, nationalSums: 0, structuralZeros };
  if (group === 'construction') {
    for (const area of areas) {
      for (const sex of ['0','1','2']) { assert.equal(get(area,sex,'00'), Array.from({length:18},(_,i)=>get(area,sex,pad(i+1))).reduce((a,b)=>a+b,0), 'age partition'); checks.agePartitions++; }
      for (let i=0;i<19;i++) {assert.equal(get(area,'0',pad(i)),get(area,'1',pad(i))+get(area,'2',pad(i)), 'sex partition'); checks.sexPartitions++;}
    }
    for (const sex of ['0','1','2']) for (let i=0;i<19;i++) { assert.equal(get('00000',sex,pad(i)),areas.slice(1).reduce((sum,a)=>sum+get(a,sex,pad(i)),0), 'national sum'); checks.nationalSums++; }
  } else {
    for (const area of areas) for (const tab of ['201-2021','211-2021']) for (const org of ['11','2']) {assert.equal(get(area,tab,'00',org),Array.from({length:11},(_,i)=>get(area,tab,pad(i+1),org)).reduce((a,b)=>a+b,0),'size partition');checks.sizePartitions++;}
    for (const tab of ['201-2021','211-2021']) for (const size of [...Array.from({length:12},(_,i)=>pad(i)),'R1','R2']) for (const org of ['11','2']) {assert.equal(get('00000',tab,size,org),areas.slice(1).reduce((sum,a)=>sum+get(a,tab,size,org),0),'national sum');checks.nationalSums++;}
  }
  return { get, checks };
}
export function extractSeries(data, config, validated) {
  assert.ok(EXPECTED_SOURCES[config.key], 'unreviewed metric');
  assert.deepEqual(Object.fromEntries(SOURCE_FIELDS.filter(k => config.source[k] !== undefined).map(k => [k, config.source[k]])), EXPECTED_SOURCES[config.key], 'metric source selection drift');
  const source = config.source, group = source.statsDataId === SOURCES[0].statsDataId ? 'construction' : 'enterprise';
  const { get } = validated || validateSource(data, group);
  assert.equal(source.kind, 'estat');
  const valueFor = area => {
    if (group === 'construction') {
      assert.equal(source.cdTab, '2020_05'); assert.equal(source.cdCat03, 'D'); assert.equal(source.cdCat04, '0');
      const ages = source.axisSum ? (assert.equal(source.axisSum.axis, 'cat02'), source.axisSum.codes) : [source.cdCat02];
      return ages.reduce((sum,age) => sum+get(area,source.cdCat01,age),0);
    }
    assert.equal(source.cdCat01, 'CR'); assert.deepEqual(source.axisSum, {axis:'cat03',codes:['11','2']});
    return source.axisSum.codes.reduce((sum,org)=>sum+get(area,source.cdTab,source.cdCat02,org),0);
  };
  const rows = prefectures.map(p => ({areaCode:p.prefCode,areaName:p.prefName,value:valueFor(p.prefCode)}));
  assert.equal(rows.length,47);assert.equal(new Set(rows.map(r=>r.areaCode)).size,47);
  const national=valueFor('00000');assert.equal(rows.reduce((sum,r)=>sum+r.value,0),national);
  return {rows,national};
}
async function loadSource(source, directory) {
  const path = resolve(directory,source.file); let bytes;
  try {bytes=await readFile(path);} catch(error) {
    if(error.code!=='ENOENT')throw error;
    const appId=process.env.NEXT_PUBLIC_ESTAT_APP_ID||process.env.ESTAT_APP_ID;
    assert.ok(appId,'e-Stat app ID required only for fetching uncached source');
    const url=new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');url.search=new URLSearchParams({appId,lang:'J',...source.parameters}).toString();
    let response;
    try {response=await fetch(url,{signal:AbortSignal.timeout(60000)});}catch {throw new Error(`e-Stat request failed: ${source.statsDataId}`);}
    assert.ok(response.ok,`e-Stat HTTP ${response.status}`);bytes=Buffer.from(await response.arrayBuffer());
  }
  const raw=JSON.parse(bytes);assert.equal(Number(raw.GET_STATS_DATA?.RESULT?.STATUS),0,'API error');
  const data=raw.GET_STATS_DATA.STATISTICAL_DATA;
  assert.equal(sha(JSON.stringify(data)),source.statisticalDataSha256,'Official data/metadata changed: review before ingesting');
  const validated=validateSource(data,source.group);
  await mkdir(directory,{recursive:true});await writeFile(path,bytes);
  return {data,validated,actualResponseSha256:sha(bytes)};
}
async function main() {
  const {values: options}=parseArgs({options:{'write-local':{type:'boolean',default:false},'source-dir':{type:'string',default:'/tmp/stats47-construction-firm-size-source'},out:{type:'string',default:'.local/verification/themes/construction-enterprise-source.json'},metric:{type:'string'}}});
  const keys=Object.values(KEYS).flat().filter(k=>!options.metric||options.metric===k);assert.ok(keys.length,'unknown metric');
  const files=[],loaded=new Map(),generatedAt=new Date().toISOString();
  for(const key of keys) {
    const group=Object.entries(KEYS).find(([,v])=>v.includes(key))[0],source=SOURCES.find(s=>s.group===group),config=METRICS_REGISTRY[key];
    assert.ok(config?.isActive,`${key}: register reviewed config first`);assert.equal(config.source.statsDataId,source.statsDataId);
    const year=group==='construction'?2020:2021;
    assert.deepEqual(config.years,{from:year,to:year});assert.equal(config.yearFormat,'calendar');
    if(!loaded.has(group))loaded.set(group,await loadSource(source,options['source-dir']));
    const {data,validated,actualResponseSha256}=loaded.get(group),extracted=extractSeries(data,config,validated);
    const yearName=group==='construction'?'2020年10月1日現在':'2021年6月1日現在';
    assert.equal(config.unit,config.source.cdTab==='201-2021'?'企業等':'人');
    const rows=extracted.rows.map(r=>({...r,unit:config.unit,yearCode:String(year),yearName}));
    const payload=parseStatsValuesPayload({metricKey:key,entityKind:'prefecture',rows,meta:{generatedAt,rowCount:47,areaCount:47,yearRange:[String(year),String(year)],recipe:buildRecipe(config)}});
    const content=JSON.stringify(payload);
    files.push({key:`app/stats/${key}/values.json`,metricKey:key,content,sha256:sha(content),source:{...source,actualResponseSha256},national:extracted.national,unit:config.unit,year,yearName,checks:validated.checks});
  }
  // All sources, series and canonical schemas must validate before any local R2 write.
  if(options['write-local'])for(const f of files){const destination=resolve(root,'.local/r2',f.key);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,f.content);}
  const report={generatedAt,status:'PASS',localStaged:options['write-local'],metrics:files.length,rows:files.length*47,files:files.map(({content,...f})=>f)};
  await mkdir(dirname(resolve(options.out)),{recursive:true});await writeFile(resolve(options.out),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({status:report.status,metrics:report.metrics,rows:report.rows,localStaged:report.localStaged,out:options.out}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
