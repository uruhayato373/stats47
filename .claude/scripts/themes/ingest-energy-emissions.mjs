import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
const require = createRequire(import.meta.url);
const ExcelJS = require('exceljs');
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const SOURCES = {
  "fit": {
    "filename": "fit.xlsx",
    "url": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH",
    "sha256": "275519e42166cee8d48d370ddf753e186bc56d3f552d9c754aae87a029af1c77",
    "bytes": 102151
  },
  "fit-index": {
    "filename": "fit-index.html",
    "url": "https://www.fit-portal.go.jp/publicinfosummary",
    "sha256": "18e75e4724deab5d047b7ef8443d8c8ca28d0e459c7af0cb7b25c25d0b621647",
    "bytes": 58752
  },
  "co2": {
    "filename": "co2.xlsx",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx",
    "sha256": "f02a7cb7e07019287d0a0dca2560738780c4b0c1e395a8a1006e85c4ef64bcf7",
    "bytes": 447074
  },
  "co2-index": {
    "filename": "co2-index.html",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/suikei.html",
    "sha256": "b9e2a485cec2f36dc22110e32b6a67720242c26d95fc39aef8cea61649f07dd1",
    "bytes": 76025
  },
  "co2-assumptions": {
    "filename": "co2-assumptions.pdf",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/suikei-1.pdf",
    "sha256": "1030ccd0c1c1e853a02235c6d2f083929d1a1b24d8bbaea335b3f920d6440360",
    "bytes": 325356
  },
  "co2-method": {
    "filename": "co2-method.pdf",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/suikei-2.pdf",
    "sha256": "defdda11077ca979c9e3ebc1da654f82879f0b7932eaf415ad0a26af14734211",
    "bytes": 777341
  },
  "co2-data-list": {
    "filename": "co2-data-list.pdf",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/suikei-3.pdf",
    "sha256": "5d93d56790b09e936d276ca002396df89a8895f7d32f5c27399cb0a57754f08d",
    "bytes": 413638
  },
  "karte-national": {
    "filename": "karte-national.pdf",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/karte/pdf/00.pdf",
    "sha256": "68eaa4c2e0c59a6b9f61940d4c9fbd4685320822b7bb49d68be8a75d03f84b5b",
    "bytes": 1306868
  },
  "karte-index": {
    "filename": "karte-index.html",
    "url": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/karte.html",
    "sha256": "c7797c9d353d36e989b2f89f55f636b122a65488946998c75bf844369bb57466",
    "bytes": 674978
  }
};
export const FIELDS = [
  {
    "key": "fit-fip-installed-capacity",
    "group": "fit",
    "year": "2026",
    "yearFormat": "calendar",
    "yearName": "2026年3月31日時点",
    "unit": "kW",
    "sourceUrl": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH"
  },
  {
    "key": "fit-fip-new-approved-installed-capacity",
    "group": "fit",
    "year": "2026",
    "yearFormat": "calendar",
    "yearName": "2026年3月31日時点",
    "unit": "kW",
    "sourceUrl": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH"
  },
  {
    "key": "fit-transition-installed-capacity",
    "group": "fit",
    "year": "2026",
    "yearFormat": "calendar",
    "yearName": "2026年3月31日時点",
    "unit": "kW",
    "sourceUrl": "https://www.fit-portal.go.jp/servlet/servlet.FileDownload?file=015hA000000lPEH"
  },
  {
    "key": "regional-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  },
  {
    "key": "regional-industry-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  },
  {
    "key": "regional-business-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  },
  {
    "key": "regional-household-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  },
  {
    "key": "regional-transport-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  },
  {
    "key": "regional-waste-co2-emissions-estimate",
    "group": "co2",
    "year": "2023",
    "yearFormat": "fiscal",
    "yearName": "2023年度",
    "unit": "千t-CO₂",
    "sourceUrl": "https://policies.env.go.jp/policy/roadmap/local_keikaku/kuiki/files/tool/suikei/2023/00.xlsx"
  }
];
export const compact=s=>String(s).normalize('NFKC').replace(/\s+/g,'');
export const htmlText=s=>String(s).replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n))).replace(/&#x([a-f\d]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16))).replace(/&nbsp;/g,' ').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&');
const cell=(s,a)=>{let v=s.getCell(a).value;if(v&&typeof v==='object'&&'result'in v)return v.result;if(v&&typeof v==='object'&&'richText'in v)return v.richText.map(r=>r.text).join('');return v;};
const sum=x=>x.reduce((a,b)=>a+b,0);
const finite=(v,label)=>{assert.ok(typeof v==='number'&&Number.isFinite(v)&&v>=0,`Invalid ${label}`);return v;};
const near=(a,b,eps=1e-6,label='identity')=>assert.ok(Math.abs(a-b)<=eps,`${label}: ${a} vs ${b}`);
export function extractFit(w,index,karte,dataList){
 const t=compact(htmlText(index));for(const v of ['2026年3月末時点','2026年8月18日更新','買取が開始された状態','本制度開始後に新たに認定を受けた設備','法の施行の日において既に発電を開始していた設備'])assert.ok(t.includes(compact(v)),v);
 for(const v of ['FIT・FIP制度で認定された設備のうち買取を開始した設備','自家消費のみで売電し'])assert.ok(compact(karte).includes(compact(v)),v);
 assert.ok(compact(dataList).includes('https://www.fit-portal.go.jp/PublicInfoSummary'));
 const specs=[{name:'表A②－１',kind:'new',total:'AI',columns:{solarUnder10:['B'],solarOver10:['D'],wind:['J','K'],hydro:['M','O','Q','S'],geothermal:['U','V'],biomass:['AC','AD','AE','AF','AG','AH']}},{name:'表A②－２',kind:'transition',total:'AH',columns:{solarUnder10:['B'],solarOver10:['C'],wind:['I','J'],hydro:['L','N','P','R'],geothermal:['T','U'],biomass:['AB','AC','AD','AE','AF','AG']}}];
 const result={};
 for(const spec of specs){const s=w.getWorksheet(spec.name);assert.ok(s);assert.equal(s.rowCount,53);assert.ok(cell(s,'A1').includes(`都道府県別導入容量（${spec.kind==='new'?'新規':'移行'}認定分）`));assert.equal(cell(s,spec.total+'2'),'（単位：kW）');assert.ok(cell(s,spec.total+'3').includes('バイオマス比率を考慮'));
 const rows=prefectures.map((p,i)=>{let r=i+6;assert.equal(cell(s,'A'+r),p.prefName);let components={};for(const[k,cols]of Object.entries(spec.columns))components[k]=sum(cols.map(c=>finite(cell(s,c+r),`${p.prefName} ${c}`)));let total=finite(cell(s,spec.total+r),`${p.prefName} total`);near(total,sum(Object.values(components)),1e-4,'FIT component sum');return{areaCode:p.prefCode,areaName:p.prefName,total,components,sourceRow:r};});
 assert.equal(cell(s,'A53'),'合計');let national=finite(cell(s,spec.total+'53'),'FIT national');near(national,sum(rows.map(r=>r.total)),1e-4,'FIT 47 sum');const nationalComponents={};for(const[k,cols]of Object.entries(spec.columns)){nationalComponents[k]=sum(cols.map(c=>finite(cell(s,c+'53'),k)));near(nationalComponents[k],sum(rows.map(r=>r.components[k])),1e-4,`FIT ${k} 47 sum`);}near(sum(Object.values(nationalComponents)),national,1e-4,'FIT national components');
 // Website uses 万kW rounded to 0.1; original workbook retains kW decimals.
 const expected=spec.kind==='new'?[1290.4,6010.1,504.6,173.2,16.3,668,8662.6]:[472.4,26.8,206.2,24.2,0.1,135.8,865.6];assert.deepEqual([...Object.values(nationalComponents),national].map(x=>Math.round(x/1000)/10),expected);for(const v of expected)assert.ok(t.includes(v.toLocaleString('en-US',{minimumFractionDigits:1,maximumFractionDigits:1})+'万kW'),'FIT website numeric match');
 result[spec.kind]={rows,national,nationalComponents};}
 const rows=prefectures.map((p,i)=>({areaCode:p.prefCode,areaName:p.prefName,values:{'fit-fip-installed-capacity':result.new.rows[i].total+result.transition.rows[i].total,'fit-fip-new-approved-installed-capacity':result.new.rows[i].total,'fit-transition-installed-capacity':result.transition.rows[i].total},components:{new:result.new.rows[i].components,transition:result.transition.rows[i].components}}));
 return{rows,national:{'fit-fip-installed-capacity':result.new.national+result.transition.national,'fit-fip-new-approved-installed-capacity':result.new.national,'fit-transition-installed-capacity':result.transition.national},sourceBreakdown:result,checks:{prefectures:47,missing:0,duplicates:0,sourceComponentIdentities:96,prefectureNationalSumMatches:14,websiteRoundedMatches:14,fitFipBreakdownAvailable:false,pointInTime:'2026-03-31',annualIncrement:false}};
}
export function extractCo2(w,index,assumptions,method,karte){
 for(const x of ['2023年度','1,741市区町村','2026(令和8)年1月末時点'])assert.ok(compact(assumptions).includes(compact(x)),x);
 for(const x of ['秘匿数値については、0(ゼロ)','都道府県の炭素排出量より小さくなる','電力･熱配分後消費･排出量'])assert.ok(compact(method).includes(compact(x)),x);
 assert.ok(compact(htmlText(karte)).includes('我が国の温室効果ガス排出インベントリに記載される排出量に必ずしも一致しない'));
 const s=w.getWorksheet('2023_一覧表');assert.ok(s);assert.equal(w.worksheets.length,1);assert.equal(s.rowCount,1743);assert.equal(cell(s,'R1'),'単位：1,000tCO2');
 const header=['都道府県コード','都道府県','市区町村コード','市区町村','製造業','建設業・鉱業','農林水産業','産業部門　小計','業務','家庭','民生部門　小計','旅客自動車','貨物自動車','鉄道','船舶','運輸部門　小計','一般廃棄物','排出量合計'];for(let c=1;c<=18;c++)assert.equal(cell(s,s.getCell(2,c).address),header[c-1]);
 const cols={total:'R',industry:'H',business:'I',household:'J',transport:'P',municipalWaste:'Q'};
 const municipal=[],seen=new Set();for(let r=3;r<=1743;r++){let code=cell(s,'C'+r),pc=cell(s,'A'+r);assert.ok(/^\d{5}$/.test(code)&&/^\d{2}$/.test(pc)&&code.startsWith(pc)&&!code.endsWith('000'));assert.ok(!seen.has(code),'duplicate municipality');seen.add(code);let p=prefectures.find(p=>p.prefCode.slice(0,2)===pc);assert.ok(p);assert.equal(cell(s,'B'+r),p.prefName);let name=cell(s,'D'+r);assert.ok(typeof name==='string'&&name.length>0);const v=Object.fromEntries(Object.entries(cols).map(([k,c])=>[k,finite(cell(s,c+r),`CO2 ${code} ${k}`)]));
 near(v.industry,sum(['E','F','G'].map(c=>finite(cell(s,c+r),c))),1e-6,'CO2 industry subtotal');near(cell(s,'K'+r),v.business+v.household,1e-6,'CO2 civil subtotal');near(v.transport,sum(['L','M','N','O'].map(c=>finite(cell(s,c+r),c))),1e-6,'CO2 transport subtotal');near(v.total,sum([v.industry,v.business,v.household,v.transport,v.municipalWaste]),1e-6,'CO2 total subtotal');
 municipal.push({municipalityCode:code,municipalityName:name,prefectureCode:p.prefCode,values:v,sourceRow:r});}
 assert.equal(seen.size,1741);const wards=municipal.filter(r=>r.municipalityName.endsWith('区'));assert.equal(wards.length,23);assert.ok(wards.every(r=>r.prefectureCode==='13000'&&r.municipalityCode>='13101'&&r.municipalityCode<='13123'));assert.ok(!seen.has('13100'));
 const htmlRows=new Map();for(const tr of index.matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/g)){const cells=[...tr[1].matchAll(/<(?:th|td)\b[^>]*>([\s\S]*?)<\/(?:th|td)>/g)].map(x=>htmlText(x[1]).trim());const name=cells.findLast(c=>prefectures.some(p=>p.prefName===c)||c==='全国');if(!name)continue;let i=cells.lastIndexOf(name);let nums=cells.slice(i+1,i+7).map(x=>Number(x.replaceAll(',','')));if(nums.length!==6||!nums.every(Number.isFinite))continue;assert.ok(!htmlRows.has(name));htmlRows.set(name,nums);}
 assert.equal(htmlRows.size,48);assert.ok(compact(htmlText(index)).includes('2023年度都道府県別データ一覧'));
 const keymap={total:'regional-co2-emissions-estimate',industry:'regional-industry-co2-emissions-estimate',business:'regional-business-co2-emissions-estimate',household:'regional-household-co2-emissions-estimate',transport:'regional-transport-co2-emissions-estimate',municipalWaste:'regional-waste-co2-emissions-estimate'};
 const rows=prefectures.map(p=>{const ms=municipal.filter(r=>r.prefectureCode===p.prefCode);assert.ok(ms.length>0);let totals=Object.fromEntries(Object.keys(cols).map(k=>[k,sum(ms.map(r=>r.values[k]))]));assert.deepEqual(Object.values(totals).map(Math.round),htmlRows.get(p.prefName),`CO2 official prefecture ${p.prefName}`);return{areaCode:p.prefCode,areaName:p.prefName,municipalities:ms.length,values:Object.fromEntries(Object.entries(totals).map(([k,v])=>[keymap[k],v]))};});
 const national=Object.fromEntries(Object.values(keymap).map(k=>[k,sum(rows.map(r=>r.values[k]))]));assert.deepEqual(Object.values(national).map(Math.round),htmlRows.get('全国'),'CO2 official national');
 return{rows,national,municipal,roundedOfficialNational:htmlRows.get('全国'),checks:{prefectures:47,municipalities:1741,uniqueMunicipalities:1741,tokyoWards:23,designatedCityWardRows:0,missing:0,sourceSubtotalIdentities:1741*4,prefectureRoundedMatches:47*6,nationalRoundedMatches:6,allocationEstimate:true,sourceDataCutoff:'2026-01-31',year:'2023'}};
}
export function verifySourceBytes(spec, bytes) { assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source changed; revalidate first`); }
async function readSource(spec, dir) {
  const path = resolve(dir, spec.filename); let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const response = await fetch(spec.url, { signal: AbortSignal.timeout(60000) });
    assert.ok(response.ok, `Official source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer()); verifySourceBytes(spec, bytes);
    await mkdir(dirname(path), { recursive: true }); await writeFile(path, bytes);
  }
  verifySourceBytes(spec, bytes); return { path, bytes };
}
export async function extractAll(sourceFiles) {
  const run=promisify(execFile);
  const pdf=async id=>(await run('pdftotext',['-layout',sourceFiles[id].path,'-'],{encoding:'utf8',maxBuffer:8*1024*1024})).stdout;
  const load=async id=>{const w=new ExcelJS.Workbook();await w.xlsx.load(sourceFiles[id].bytes);return w;};
  return {
    fit:extractFit(await load('fit'),sourceFiles['fit-index'].bytes.toString('utf8'),await pdf('karte-national'),await pdf('co2-data-list')),
    co2:extractCo2(await load('co2'),sourceFiles['co2-index'].bytes.toString('utf8'),await pdf('co2-assumptions'),await pdf('co2-method'),sourceFiles['karte-index'].bytes.toString('utf8')),
  };
}
export function buildOutputs(extracted,registry,generatedAt) {
  return FIELDS.map(({key,group,unit,year,yearFormat,yearName,sourceUrl})=>{
    const config=registry[key];assert.ok(config?.isActive&&config.unit===unit&&config.yearFormat===yearFormat,`${key}: config mismatch`);
    assert.ok(config.source.kind==='external'&&config.source.fetcherKey==='manual');assert.equal(config.source.config.provenance.url,sourceUrl);
    assert.deepEqual(config.years,{from:Number(year),to:Number(year)});
    const sourceRows=extracted[group].rows;assert.equal(sourceRows.length,47);
    const rows=sourceRows.map(({areaCode,areaName,values},i)=>{assert.equal(areaCode,prefectures[i].prefCode);assert.equal(areaName,prefectures[i].prefName);return{areaCode,areaName,value:finite(values[key],key),unit,yearCode:year,yearName};});
    const payload=parseStatsValuesPayload({metricKey:key,entityKind:'prefecture',rows,meta:{generatedAt,rowCount:47,areaCount:47,yearRange:[year,year],recipe:buildRecipe(config)}});
    const content=JSON.stringify(payload);return{key:`app/stats/${key}/values.json`,metricKey:key,sha256:sha(content),sourceMatchedRows:rows.length,content};
  });
}
async function main() {
  const {values:options}=parseArgs({options:{'write-local':{type:'boolean',default:false},'source-dir':{type:'string',default:'/tmp/stats47-energy-emissions-source'},out:{type:'string',default:'.local/verification/themes/energy-emissions-source.json'},help:{type:'boolean',default:false}}});
  if(options.help){console.log('Verify FIT/FIP installed capacities at 2026-03-31 and standard-method regional CO2 estimates for FY2023. Requires pdftotext. --write-local writes canonical local stats only. No remote writes.');return;}
  const sourceFiles={};for(const[id,spec]of Object.entries(SOURCES))sourceFiles[id]=await readSource(spec,options['source-dir']);
  const extracted=await extractAll(sourceFiles);const generatedAt=new Date().toISOString();const outputs=buildOutputs(extracted,METRICS_REGISTRY,generatedAt);
  // Validate all source groups and canonical payloads before any stats write.
  if(options['write-local'])for(const output of outputs){const path=resolve(root,'.local/r2',output.key);await mkdir(dirname(path),{recursive:true});await writeFile(path,output.content);}
  const report={generatedAt,status:options['write-local']?'source-verified-staged':'source-verified',sources:SOURCES,checks:{fit:extracted.fit.checks,co2:extracted.co2.checks},national:{fit:extracted.fit.national,co2:extracted.co2.national},municipalityCounts:extracted.co2.rows.map(({areaCode,municipalities})=>({areaCode,municipalities})),files:outputs.map(({content,...file})=>file),limitations:[
    '導入＝買取開始済み累積容量。新規認定分は当年増分ではない。旧制度移行分はFIT→FIP移行ではなく、制度開始前からの設備等。FIT/FIP別内訳なし。バイオマス比率考慮済み。',
    'CO2は標準的手法の活動量按分参考推計。1,741市区町村を重複なしで県に積上げ、全国もその合計。全温室効果ガスや全国インベントリではない。',
    'CO2の対象は電力・熱配分後のエネルギー起源と一般廃棄物焼却。森林吸収・その他非エネルギー起源・運輸航空を含めない。原推計の製造品出荷額秘匿はゼロ扱い。',
    'FIT/FIPの自家消費のみ・非認定の全設備を網羅せず、kW容量はkWh発電量ではない。CO2削減への直接換算はしない。',
  ]};
  const out=resolve(root,options.out);await mkdir(dirname(out),{recursive:true});await writeFile(out,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({metrics:outputs.length,values:outputs.length*47,output:out}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error);process.exitCode=1;});
