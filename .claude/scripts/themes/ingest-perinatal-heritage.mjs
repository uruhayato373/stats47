import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseArgs, promisify } from 'node:util';
import { execFile } from 'node:child_process';
const require = createRequire(import.meta.url);
const prefectures = require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY } = require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe } = require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload } = require('../../../packages/stats-r2/src/schemas.ts');
const root = resolve(dirname(fileURLToPath(import.meta.url)), '../../..');
const sha = (bytes) => createHash('sha256').update(bytes).digest('hex');
export const SOURCES = {
  "centers": {
    "filename": "001712292.pdf",
    "url": "https://www.mhlw.go.jp/content/10800000/001712292.pdf",
    "sha256": "2b316c0d648f14c50ec7a9bee375d13697229ec112dbbdaab63e86d4e6bd0b0e",
    "publicationIndexUrl": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000186912.html",
    "observationDate": "2026-04-01"
  },
  "designations": {
    "filename": "pref-designations.html",
    "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html",
    "sha256": "6a77c0243d0b2f10214b67198a3f7699a82c9930669bb8aca0392ca194020431",
    "observationDate": "2025-05-01"
  },
  "designationTrend": {
    "filename": "pref-designations-trend.html",
    "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/kensu_suii.html",
    "sha256": "a643cfad4869fad8b989a78cb6067d8d2e838bad3b5c8f4c73479ac38f03ce51",
    "observationDate": "2025-05-01"
  },
  "cost": {
    "filename": "94396001_01.pdf",
    "url": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf",
    "sha256": "fbbee75d06382ddb3eb3fd499deef202ada7e65ad7ddbd92cd9b46d450c085fa",
    "publicationIndexUrl": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/",
    "publicationDate": "2026-05",
    "observationPeriod": "FY2024"
  },
  "staff": {
    "filename": "94356801_01.pdf",
    "url": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf",
    "sha256": "7470e315d3b6bb9974af8b9d94e5e796d6e68e4a4563442d1640e31918ab7990",
    "publicationIndexUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/maizo.html",
    "publicationDate": "2026-03",
    "observationDate": "2025-05-01"
  },
  "medicalSummary": {
    "filename": "medical-summary.pdf",
    "url": "https://www.mhlw.go.jp/toukei/saikin/hw/iryosd/23/dl/02sisetu05.pdf",
    "sha256": "944ac7bb168567bebfd767b10fcf80b672dcf829b374748f9ec6126c370154b6",
    "publicationIndexUrl": "https://www.mhlw.go.jp/toukei/saikin/hw/iryosd/23/",
    "observationDate": "2023-10-01"
  },
  "0004024872": {
    "filename": "0004024872-getStatsData.json",
    "url": "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
    "sha256": "26d174a9ae9d7fd3993de2647d35144a4002c31f391925d0cbae0963353236d4",
    "parameters": {
      "statsDataId": "0004024872",
      "lang": "J",
      "cdCat01": "2",
      "limit": 1000
    },
    "publicationIndexUrl": "https://www.e-stat.go.jp/dbview?sid=0004024872",
    "observationDate": "2023-10-01",
    "contentSha256": "5c164b1947def2b4812e7a3e1cdc56c6c1158189685a3be097444469f39839b1"
  },
  "0004024910": {
    "filename": "0004024910-getStatsData.json",
    "url": "https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData",
    "sha256": "9c193f88d59aa6861b5b6e07b19a9f8d3d72f49715b8d66557f13c5b7f79bb77",
    "parameters": {
      "statsDataId": "0004024910",
      "lang": "J",
      "cdCat01": "2",
      "limit": 1000
    },
    "publicationIndexUrl": "https://www.e-stat.go.jp/dbview?sid=0004024910",
    "observationDate": "2023-10-01",
    "contentSha256": "330dca65cf682582103efc4de39b9903be250e2a3e96629b6c18ce09fab9aaee"
  }
};
export const FIELDS = [
  {
    "key": "general-perinatal-center-count",
    "unit": "施設",
    "group": "centers",
    "year": "2026",
    "yearName": "2026-04-01時点",
    "yearFormat": "calendar",
    "national": 113,
    "sourceUrl": "https://www.mhlw.go.jp/content/10800000/001712292.pdf"
  },
  {
    "key": "regional-perinatal-center-count",
    "unit": "施設",
    "group": "centers",
    "year": "2026",
    "yearName": "2026-04-01時点",
    "yearFormat": "calendar",
    "national": 298,
    "sourceUrl": "https://www.mhlw.go.jp/content/10800000/001712292.pdf"
  },
  {
    "key": "delivery-hospital-count",
    "unit": "施設",
    "group": "0004024872",
    "year": "2023",
    "yearName": "2023-10-01時点",
    "yearFormat": "calendar",
    "national": 909,
    "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004024872"
  },
  {
    "key": "delivery-clinic-count",
    "unit": "施設",
    "group": "0004024910",
    "year": "2023",
    "yearName": "2023-10-01時点",
    "yearFormat": "calendar",
    "national": 949,
    "sourceUrl": "https://www.e-stat.go.jp/dbview?sid=0004024910"
  },
  {
    "key": "prefecture-designated-cultural-property-count",
    "unit": "件",
    "group": "designations",
    "year": "2025",
    "yearName": "2025-05-01時点",
    "yearFormat": "calendar",
    "national": 22545,
    "sourceUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/chiho_shitei/todofuken.html"
  },
  {
    "key": "prefectural-cultural-property-protection-expenditure",
    "unit": "千円",
    "group": "cost",
    "year": "2024",
    "yearName": "2024年度",
    "yearFormat": "fiscal",
    "national": 38718774,
    "sourceUrl": "https://www.bunka.go.jp/tokei_hakusho_shuppan/tokeichosa/chiho_bunkagyosei/pdf/94396001_01.pdf"
  },
  {
    "key": "buried-cultural-property-specialist-count",
    "unit": "人",
    "group": "staff",
    "year": "2025",
    "yearName": "2025-05-01時点",
    "yearFormat": "calendar",
    "national": 5571,
    "sourceUrl": "https://www.bunka.go.jp/seisaku/bunkazai/shokai/pdf/94356801_01.pdf"
  }
];
export const compact=s=>String(s).normalize('NFKC').replace(/\s+/g,'');
const shortName=s=>s==='北海道'?s:s.replace(/[都府県]$/,'');
const num=s=>{assert.match(String(s),/^\d[\d,]*$/);return Number(String(s).replaceAll(',',''));};
function all47(rows){assert.equal(rows.length,47);assert.deepEqual(rows.map(r=>r.areaCode),prefectures.map(p=>p.prefCode));for(const r of rows)for(const v of Object.values(r.values))assert.ok(Number.isFinite(v)&&v>=0);return rows;}
function rowsFromMap(m){assert.equal(m.size,47);return all47(prefectures.map(p=>{assert.ok(m.has(p.prefName),p.prefName);return{areaCode:p.prefCode,areaName:p.prefName,...m.get(p.prefName)};}));}
export function extractCenters(text){
 assert.ok(compact(text).includes('令和8年4月1日現在'));
 const facilities=[];const m=new Map(prefectures.map(p=>[p.prefName,{values:{'general-perinatal-center-count':0,'regional-perinatal-center-count':0}}]));
 let current=null;const seen=new Set();
 for(const l of text.split('\n')){
  const line=l.trim();const first=prefectures.find(p=>line.startsWith(p.prefName+' '));if(first)current=first.prefName;
  const match=line.match(/^(?:(\S+)\s+)?(総合|地域)\s+(.+?)\s+([HR]\d+\.\d+\.\d+)\s+(.+?)\s+([\d-]+)$/);
  if(!match){if(/^(?:(?:\S+)\s+)?(?:総合|地域)\s+/.test(line)&&!/(113|298)箇所/.test(line))throw Error('Unparsed center facility: '+line);continue;}
  const [,printed,type,name,date,address,phone]=match;
  assert.ok(current,'Missing prefecture');if(printed)assert.equal(printed,current);
  const addressPref=prefectures.find(p=>compact(address).startsWith(p.prefName));if(addressPref)assert.equal(addressPref.prefName,current);
  const id=current+'|'+compact(name);assert.ok(!seen.has(id),'Duplicate center');seen.add(id);
  const key=type==='総合'?'general-perinatal-center-count':'regional-perinatal-center-count';m.get(current).values[key]++;
  facilities.push({prefecture:current,type,name:compact(name),designationDate:date,address:compact(address),addressPrefectureExplicit:!!addressPref,sourceLine:line});
 }
 const rows=rowsFromMap(m);const national={'general-perinatal-center-count':113,'regional-perinatal-center-count':298};
 for(const [key,value]of Object.entries(national))assert.equal(rows.reduce((n,r)=>n+r.values[key],0),value);
 assert.ok(compact(text).includes('総合113箇所合計地域298箇所'));assert.equal(facilities.length,411);
 return{rows,national,facilities,checks:{prefectures:47,facilityRows:411,addressPrefectureMatches:facilities.filter(f=>f.addressPrefectureExplicit).length,addressPrefectureOmitted:facilities.filter(f=>!f.addressPrefectureExplicit).length,sourceNationalMatches:2}};
}
export function extractDesignations(html,trend){
 assert.ok(compact(html).includes('令和7年5月1日'));assert.ok(compact(html).includes('都道府県別指定等文化財件数'));
 const table=html.match(/<table\b[^>]*>[\s\S]*?<\/table>/i)?.[0];assert.ok(table);
 // Official HTML omits the opening <tr> of Hokkaido. Parse cells through the closing row tag, retaining all 47 records.
 const groups=table.split(/<\/tr>/i).map(part=>[...part.matchAll(/<t[dh]\b[^>]*>([\s\S]*?)<\/t[dh]>/gi)].map(x=>compact(x[1].replace(/<[^>]*>/g,'').replaceAll('&nbsp;',' '))));
 const m=new Map();let national;
 for(const cells of groups){
  if(cells[0]==='合計'){national=num(cells.at(-1));continue;}
  if(!/^\d+$/.test(cells[0]??''))continue;
  assert.equal(cells.length,18);const p=prefectures[num(cells[0])-1];assert.equal(cells[1],p.prefName);assert.ok(!m.has(p.prefName));const n=cells.slice(2).map(num);
  assert.equal(n.reduce((s,v,i)=>s+(i===1||i===15?0:v),0),n[15],'Exclude building structures count from total');
  m.set(p.prefName,{values:{'prefecture-designated-cultural-property-count':n[15]},categoryCells:n,sourceRow:num(cells[0])});
 }
 const rows=rowsFromMap(m);assert.equal(national,22545);assert.equal(rows.reduce((s,r)=>s+r.values['prefecture-designated-cultural-property-count'],0),national);
 assert.ok(compact(trend).includes('22,545'));assert.ok(compact(trend).includes('令和7'));
 return{rows,national:{'prefecture-designated-cultural-property-count':national},checks:{prefectures:47,categorySubtotals:47,sourceNationalMatches:true,trendNationalMatches:true}};
}
export function extractHeritageCost(text){
 const normalized=text.normalize('NFKC');assert.ok(compact(text).includes('令和6年度文化関係経費'));assert.ok(compact(text).includes('令和8年5月'));
 const section=normalized.split('<令和6年度都道府県集計表>')[1]?.split('<令和6年度政令指定都市集計表>')[0];assert.ok(section,'Missing prefecture table');
 const m=new Map();let total;
 for(let line of section.split('\n')){
  line=line.replace(/^-62-\s*/,'').replace(/^-63-\s*/,'').trim();
  const cells=line.split(/\s+/);if(cells[0]==='合計'){total=cells.slice(-3).map(num);continue;}
  if(!/^\d{1,2}$/.test(cells[0]??'')||!prefectures.some(p=>p.prefName===cells[1]))continue;
  const p=prefectures[num(cells[0])-1];assert.equal(cells[1],p.prefName);assert.ok(!m.has(p.prefName));
  // Total, national funding and prefectural funding are the last 3 complete columns; an Osaka inner funding cell is blank in the official table.
  assert.ok(cells.length>=16&&cells.length<=17,'Unexpected columns '+cells.length+' '+line);const [amount,nationalFunding,prefFunding]=cells.slice(-3).map(num);assert.equal(amount,nationalFunding+prefFunding);
  m.set(p.prefName,{values:{'prefectural-cultural-property-protection-expenditure':amount},nationalFunding,prefFunding,sourceLine:line});
 }
 const rows=rowsFromMap(m);assert.deepEqual(total,[38718774,15630454,23088320]);assert.equal(rows.reduce((s,r)=>s+r.values['prefectural-cultural-property-protection-expenditure'],0),total[0]);assert.equal(rows.reduce((s,r)=>s+r.nationalFunding,0),total[1]);assert.equal(rows.reduce((s,r)=>s+r.prefFunding,0),total[2]);
 return{rows,national:{'prefectural-cultural-property-protection-expenditure':total[0]},checks:{prefectures:47,fundingIdentities:47,sourceNationalMatches:3}};
}
export function extractHeritageStaff(text){
 const page=text.split('\f').find(p=>compact(p).startsWith('3.令和7年度埋蔵文化財専門職員の体制'));assert.ok(page);assert.ok(compact(page).includes('令和7年5月1日現在'));
 const m=new Map();let national;
 for(const line of page.split('\n')){
  const match=line.trim().match(/^([^\d]+?)\s+([\d,]+)\s+(.*)$/);if(!match)continue;
  const name=compact(match[1]);const p=prefectures.find(p=>shortName(p.prefName)===name);if(!p&&name!=='合計')continue;
  const tokens=(match[2]+' '+match[3]).trim().split(/\s+/);assert.equal(tokens.length,24);const values=tokens.map((t,i)=>i===10?null:i===13?num(t.replace('%','')):Number(t.replaceAll(',','')));assert.equal(tokens[10],'/');
  for(const [parts,t]of [[[0,2,4],6],[[1,3,5],7],[[6,7],8],[[14,16,18],20],[[15,17,19],21],[[20,21],22],[[8,22],23]])assert.equal(parts.reduce((s,i)=>s+values[i],0),values[t]);
  if(!p){national=values[23];continue;}assert.ok(!m.has(p.prefName));m.set(p.prefName,{values:{'buried-cultural-property-specialist-count':values[23]},prefectureStaff:values[8],municipalStaff:values[22],sourceLine:line.trim()});
 }
 const rows=rowsFromMap(m);assert.equal(national,5571);assert.equal(rows.reduce((s,r)=>s+r.values['buried-cultural-property-specialist-count'],0),national);
 return{rows,national:{'buried-cultural-property-specialist-count':national},checks:{prefectures:47,staffCompositionIdentities:47*7,sourceNationalMatches:true}};
}
export function extractDelivery(data,id,summary){
 const payload=data.GET_STATS_DATA;assert.equal(Number(payload.RESULT.STATUS),0);const s=payload.STATISTICAL_DATA;const axes=s.CLASS_INF.CLASS_OBJ;const cat=axes.find(a=>a['@id']==='cat02');assert.ok(cat);const byCode=new Map(cat.CLASS.map(c=>[c['@code'],c]));
 const key=id==='0004024872'?'delivery-hospital-count':'delivery-clinic-count';const tab=id==='0004024872'?'50':'7';const m=new Map();let national;let excluded=0;
 assert.equal(axes.find(a=>a['@id']==='cat01').CLASS['@name']??axes.find(a=>a['@id']==='cat01').CLASS.find(c=>c['@code']==='2')['@name'],'分娩取扱（施設数）');
 for(const v of s.DATA_INF.VALUE){assert.equal(v['@tab'],tab);assert.equal(v['@cat01'],'2');assert.equal(v['@time'],'2023000000');const cls=byCode.get(v['@cat02']);assert.ok(cls);if(cls['@name']==='全国'){national=num(v.$);continue;}if(cls['@parentCode']!=='00100'||cls['@level']!=='2'){excluded++;continue;}const p=prefectures.find(p=>shortName(p.prefName)===cls['@name']);assert.ok(p);assert.ok(!m.has(p.prefName));assert.equal(v['@cat02'],String(100+(prefectures.indexOf(p)+1)*10).padStart(5,'0'));m.set(p.prefName,{values:{[key]:num(v.$)},sourceClassCode:v['@cat02']});}
 const rows=rowsFromMap(m);assert.equal(national,id==='0004024872'?909:949);assert.equal(rows.reduce((s,r)=>s+r.values[key],0),national);assert.equal(excluded,83);assert.ok(compact(summary).includes('分娩取扱ありとは、9月中の分娩の有無にかかわらず、施設で分娩を取り扱っている場合をいう。'));assert.ok(compact(summary).includes('一般病院7065909154'));assert.ok(compact(summary).includes('一般診療所10489494940'));
 return{rows,national:{[key]:national},checks:{prefectures:47,excludedReprintedCities:83,metadataNameAndCodeMatches:47,sourceNationalMatches:true,pdfNationalMatches:true}};
}

export function verifySourceBytes(spec, bytes) {
  if (spec.contentSha256) {
    // API envelope dates change at each GET. Pin the entire statistical payload,
    // including metadata and cells; preserve the observed raw response SHA in the report.
    const data = JSON.parse(bytes.toString('utf8'));
    assert.equal(Number(data.GET_STATS_DATA?.RESULT?.STATUS), 0);
    assert.equal(sha(JSON.stringify(data.GET_STATS_DATA.STATISTICAL_DATA)), spec.contentSha256, `${spec.filename}: statistical payload changed`);
  } else assert.equal(sha(bytes), spec.sha256, `${spec.filename}: source changed; revalidate first`);
}
async function readSource(spec, dir) {
  const path = resolve(dir, spec.filename);
  let bytes;
  try { bytes = await readFile(path); } catch (error) {
    if (error.code !== 'ENOENT') throw error;
    const url = new URL(spec.url);
    if (spec.parameters) {
      const appId = process.env.NEXT_PUBLIC_ESTAT_APP_ID || process.env.ESTAT_APP_ID;
      assert.ok(appId, 'Missing e-Stat credential; use --env-file=apps/web/.env.development');
      for (const [k, v] of Object.entries({ ...spec.parameters, appId })) url.searchParams.set(k, String(v));
    }
    let response;
    try { response = await fetch(url, { signal: AbortSignal.timeout(60000) }); }
    catch { throw new Error(`Official source request failed: ${spec.filename}`); }
    assert.ok(response.ok, `Official source HTTP ${response.status}`);
    bytes = Buffer.from(await response.arrayBuffer());
    verifySourceBytes(spec, bytes);
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, bytes);
  }
  verifySourceBytes(spec, bytes);
  return { path, bytes, sha256: sha(bytes) };
}
export function buildOutputs(extracted, registry, generatedAt) {
  return FIELDS.map((field) => {
    const { key, group, unit, year, yearName, yearFormat, sourceUrl } = field;
    const config = registry[key];
    assert.ok(config?.isActive && config.unit === unit && config.yearFormat === yearFormat, `${key}: config mismatch`);
    assert.ok(config.source.kind === 'external' && config.source.fetcherKey === 'manual');
    assert.equal(config.source.config.provenance.url, sourceUrl);
    assert.deepEqual(config.years, { from: Number(year), to: Number(year) });
    const rows = extracted[group].rows.map(({ areaCode, areaName, values }) => ({ areaCode, areaName, value: values[key], unit, yearCode: year, yearName }));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [year, year], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload);
    return { metricKey: key, key: `app/stats/${key}/values.json`, sha256: sha(content), sourceMatchedRows: rows.length, national: extracted[group].national[key], content };
  });
}
export async function extractAll(sourceFiles) {
  const run = promisify(execFile);
  const pdfText = async (id) => (await run('pdftotext', ['-layout', sourceFiles[id].path, '-'], { encoding: 'utf8', maxBuffer: 12 * 1024 * 1024 })).stdout;
  const centerText = await pdfText('centers');
  const costText = await pdfText('cost');
  const staffText = await pdfText('staff');
  const summaryText = await pdfText('medicalSummary');
  const extracted = {
    centers: extractCenters(centerText),
    designations: extractDesignations(sourceFiles.designations.bytes.toString('utf8'), sourceFiles.designationTrend.bytes.toString('utf8')),
    cost: extractHeritageCost(costText),
    staff: extractHeritageStaff(staffText),
  };
  for (const id of ['0004024872', '0004024910']) extracted[id] = extractDelivery(JSON.parse(sourceFiles[id].bytes.toString('utf8')), id, summaryText);
  return extracted;
}
async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-perinatal-heritage-source' },
    out: { type: 'string', default: '.local/verification/themes/perinatal-heritage-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Verify 7 official prefecture indicators. Requires pdftotext; --write-local writes canonical local stats only. No remote writes.'); return; }
  const sources = {};
  for (const [id, spec] of Object.entries(SOURCES)) sources[id] = await readSource(spec, options['source-dir']);
  const extracted = await extractAll(sources);
  const generatedAt = new Date().toISOString();
  const outputs = buildOutputs(extracted, METRICS_REGISTRY, generatedAt);
  // Validate all 7 payloads before any stats write.
  if (options['write-local']) for (const output of outputs) { const path = resolve(root, '.local/r2', output.key); await mkdir(dirname(path), { recursive: true }); await writeFile(path, output.content); }
  const report = {
    generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified',
    sources: Object.fromEntries(Object.entries(SOURCES).map(([id, spec]) => [id, { ...spec, observedRawSha256: sources[id].sha256 }])),
    checks: Object.fromEntries(Object.entries(extracted).map(([id, data]) => [id, data.checks])),
    files: outputs.map(({ content, ...output }) => output),
    limitations: [
      '分娩施設は2023-10-01現在の取扱あり。9月に分娩実績があった施設だけの集計とは区別する。出生数との比較は地域需要に対する供給の目安で、患者流出入や施設の分娩負担を表さない。',
      '周産期センター2026-04-01はNICU病床数や全分娩施設数ではない。施設表で住所から県名を省略した3施設は明示された都道府県欄に帰属する。',
      '指定等文化財は県指定等分のみ、保護経費は県政府決算のみ、職員は埋蔵文化財専門職員のみ。母集団が異なるため単純に1件当たり経費・職員にはしない。',
    ],
  };
  const out = resolve(root, options.out); await mkdir(dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: outputs.length, values: outputs.reduce((n, o) => n + o.sourceMatchedRows, 0), output: out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
