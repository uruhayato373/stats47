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
  "screening": {
    "filename": "screening.xlsx",
    "url": "https://www.mhlw.go.jp/content/12400000/001718946.xlsx",
    "sha256": "6baa69fab4fbb1d57390978ddf6a8a571eb08a602f79a6528258db37e5663254",
    "bytes": 18976
  },
  "guidance": {
    "filename": "guidance.xlsx",
    "url": "https://www.mhlw.go.jp/content/12400000/001718947.xlsx",
    "sha256": "6ea9460adbe7574cab249378593ba063cca775128cebfe5af12ebb3a43477353",
    "bytes": 22881
  },
  "metabolic": {
    "filename": "metabolic.xlsx",
    "url": "https://www.mhlw.go.jp/content/12400000/001718948.xlsx",
    "sha256": "65ef461c3406c0cdcfafa8341fcec2d01abe8a7f150f8d68f64c465b1e85271e",
    "bytes": 19682
  },
  "fitness-prefectures": {
    "filename": "fitness-prefectures.pdf",
    "url": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf",
    "sha256": "aa5de0213985a38d471d9f9e572455dbf19a253dd65b61290f5bf969ce758d12",
    "bytes": 778338
  },
  "fitness-method": {
    "filename": "fitness-method.pdf",
    "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_000401.pdf",
    "sha256": "73a90014610ddd3a29b74bf57c57b4cf8ae7a5ade5a00506347b2814676a467d",
    "bytes": 771927
  },
  "fitness-errata": {
    "filename": "fitness-errata.pdf",
    "url": "https://www.mext.go.jp/sports/content/20260120-spt_sseisaku02-000046317_0000022.pdf",
    "sha256": "9228f018762a301e5083bab3f8aa1089224fd987fab990400f706f1482603b78",
    "bytes": 262518
  },
  "fitness-elementary": {
    "filename": "fitness-elementary.xlsx",
    "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx",
    "sha256": "2cb2fc59571f9017c23e9355b625b1457ca3e17fee7507eb06537f763fba386b",
    "bytes": 272116
  },
  "fitness-elementary-questionnaire": {
    "filename": "fitness-elementary-questionnaire.xlsx",
    "url": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001002.xlsx",
    "sha256": "7754dd0040b990944d30c0dbcc9ccef4e0cb2ebb5c1333a094f0eef61e920b6e",
    "bytes": 407240
  },
  "screening-index": {
    "filename": "screening-index.html",
    "url": "https://www.mhlw.go.jp/stf/newpage_03092.html",
    "sha256": "a1fee747f3def9daa5692afe84b156b96f3a706de1db4cc08b67cf77941cebbf"
  },
  "fitness-index": {
    "filename": "fitness-index.html",
    "url": "https://www.mext.go.jp/sports/b_menu/toukei/kodomo/zencyo/1411922_00014.html",
    "sha256": "2a40b4644b49bf7870fde376d1c33758de91fc92d25d2a27338af208ee809010"
  },
  "screening-national": {
    "filename": "screening-national.pdf",
    "url": "https://www.mhlw.go.jp/content/12400000/001718882.pdf",
    "sha256": "f521230148b9015b9e5727d640c5057dc98d6bcf563ab3249da5c00068f98868"
  }
};
export const FIELDS = [
  {
    "key": "specific-health-checkup-participation-rate",
    "group": "screening",
    "unit": "％",
    "year": "2024",
    "sourceUrl": "https://www.mhlw.go.jp/content/12400000/001718946.xlsx"
  },
  {
    "key": "specific-health-guidance-completion-rate",
    "group": "screening",
    "unit": "％",
    "year": "2024",
    "sourceUrl": "https://www.mhlw.go.jp/content/12400000/001718947.xlsx"
  },
  {
    "key": "metabolic-syndrome-prevalence-among-checkup-recipients",
    "group": "screening",
    "unit": "％",
    "year": "2024",
    "sourceUrl": "https://www.mhlw.go.jp/content/12400000/001718948.xlsx"
  },
  {
    "key": "elementary5-fitness-score-male",
    "group": "fitness",
    "unit": "点",
    "year": "2025",
    "sourceUrl": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx"
  },
  {
    "key": "elementary5-fitness-score-female",
    "group": "fitness",
    "unit": "点",
    "year": "2025",
    "sourceUrl": "https://www.mext.go.jp/sports/content/20251216-spt_sseisaku02-000046317_001001.xlsx"
  },
  {
    "key": "elementary5-weekly-exercise-420min-rate-male",
    "group": "fitness",
    "unit": "％",
    "year": "2025",
    "sourceUrl": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf"
  },
  {
    "key": "elementary5-weekly-exercise-420min-rate-female",
    "group": "fitness",
    "unit": "％",
    "year": "2025",
    "sourceUrl": "https://www.mext.go.jp/sports/content/20260113-spt_sseisaku02-000046317_0000001.pdf"
  }
];
export const compact=s=>String(s).normalize('NFKC').replace(/\s+/g,'');
const cell=(s,a)=>{const v=s.getCell(a).value;if(v&&typeof v==='object'&&'result'in v)return v.result;if(v&&typeof v==='object'&&'richText'in v)return v.richText.map(r=>r.text).join('');return v;};
const finite=(n,label)=>{assert.ok(typeof n==='number'&&Number.isFinite(n)&&n>=0,`Invalid ${label}`);return n;};
const near=(a,b,eps=1e-8,label='numeric identity')=>assert.ok(Math.abs(a-b)<=eps,`${label}: ${a} vs ${b}`);
const sum=(x)=>x.reduce((a,b)=>a+b,0);
function numbered(s,start){const rows=[];s.eachRow((r,i)=>{if(typeof cell(s,'A'+i)==='number')rows.push(i);});assert.deepEqual(rows,Array.from({length:47},(_,i)=>i+start));}
export function extractScreening(workbooks,index,nationalText){
 const s=workbooks.screening.getWorksheet('特定健康診査'),g=workbooks.guidance.worksheets[0],m=workbooks.metabolic.worksheets[0];assert.ok(s&&g&&m);
 for(const [sheet,title,start]of [[s,'令和6年度都道府県別特定健診受診率',5],[g,'令和6年度都道府県別特定保健指導実施率',7],[m,'令和6年度メタボリックシンドローム該当者割合等',7]]){assert.equal(cell(sheet,'A1'),title);numbered(sheet,start);}
 for(const token of ['特定健康診査対象者数は、都道府県別人口を基にした推計値','郵便番号から都道府県を判別できない場合は、集計から除外','医療保険者から国に報告'])assert.ok(compact(index).includes(compact(token)));
 assert.equal(cell(s,'C2'),'特定健診対象者数（推計値）');assert.equal(cell(s,'D2'),'特定健康診査受診者数');assert.ok(compact(cell(g,'L2')).includes('(G/F)'));assert.equal(cell(m,'C2'),'特定健康診査受診者数');assert.equal(cell(m,'D2'),'メタボリックシンドローム該当者数');
 const rows=prefectures.map((p,i)=>{
  const rs=i+5,rg=i+7;for(const [sh,r]of [[s,rs],[g,rg],[m,rg]]){assert.equal(cell(sh,'A'+r),i+1);assert.equal(cell(sh,'B'+r),p.prefName);}
  const target=finite(cell(s,'C'+rs),'estimated eligible'),recipients=finite(cell(s,'D'+rs),'recipients'),screeningFraction=finite(cell(s,'E'+rs),'screening fraction');near(screeningFraction,recipients/target);
  const counts=Object.fromEntries(['C','D','E','G','H','J','K'].map(c=>[c,finite(cell(g,c+rg),c)]));for(const n of Object.values(counts))assert.ok(Number.isSafeInteger(n));assert.equal(counts.J,counts.C+counts.G);assert.equal(counts.K,counts.D+counts.E+counts.H);assert.ok(counts.K<=counts.J);const guidanceFraction=finite(cell(g,'L'+rg),'guidance fraction');near(guidanceFraction,counts.K/counts.J);
  const metabolic=finite(cell(m,'D'+rg),'metabolic count'),metabolicFraction=finite(cell(m,'E'+rg),'metabolic fraction'),pre=finite(cell(m,'F'+rg),'metabolic preliminary');assert.equal(cell(m,'C'+rg),recipients);near(metabolicFraction,metabolic/recipients);near(cell(m,'G'+rg),pre/recipients);assert.ok(metabolic+pre<=recipients);
  for(const v of [screeningFraction,guidanceFraction,metabolicFraction])assert.ok(v>=0&&v<=1);
  return{areaCode:p.prefCode,areaName:p.prefName,values:{'specific-health-checkup-participation-rate':screeningFraction*100,'specific-health-guidance-completion-rate':guidanceFraction*100,'metabolic-syndrome-prevalence-among-checkup-recipients':metabolicFraction*100},counts:{estimatedEligible:target,recipients,guidanceTarget:counts.J,guidanceCompleted:counts.K,metabolic,preliminary:pre},sourceRows:{screening:rs,guidance:rg,metabolic:rg}};
 });
 const totals={};for(const key of Object.keys(rows[0].counts))totals[key]=sum(rows.map(r=>r.counts[key]));
 near(totals.estimatedEligible,cell(s,'C52'),1e-6);assert.equal(totals.recipients,cell(s,'D52'));assert.equal(totals.recipients,cell(m,'C54'));assert.equal(totals.guidanceTarget,cell(g,'J54'));assert.equal(totals.guidanceCompleted,cell(g,'K54'));assert.equal(totals.metabolic,cell(m,'D54'));assert.equal(totals.preliminary,cell(m,'F54'));
 near(totals.recipients/totals.estimatedEligible,cell(s,'E52'));near(totals.guidanceCompleted/totals.guidanceTarget,cell(g,'L54'));near(totals.metabolic/totals.recipients,cell(m,'E54'));
 assert.ok(compact(nationalText).includes('2024年度51,422,36731,607,34161.5%'));assert.ok(compact(nationalText).includes('2024年度5,243,16116.6%1,481,62728.3%'));
 const officialNational={estimatedEligible:51422367,recipients:31607341,guidanceTarget:5243161,guidanceCompleted:1481627,screeningRate:61.5,guidanceRate:28.3};const differences={recipients:officialNational.recipients-totals.recipients,guidanceTarget:officialNational.guidanceTarget-totals.guidanceTarget,guidanceCompleted:officialNational.guidanceCompleted-totals.guidanceCompleted};assert.deepEqual(differences,{recipients:11105,guidanceTarget:1776,guidanceCompleted:14616});
 return{rows,prefectureAggregate:totals,officialNational,differences,checks:{prefectures:47,sourceRatios:141,sourceCountTotals:7,recipientCrossTableMatches:47,missing:0,duplicates:0,nationalSamePopulation:false}};
}
function pdfRows(page,type){const m=new Map();for(const l of page.split('\n')){const cells=l.trim().split(/\s+/),name=cells[0];if(!prefectures.some(p=>p.prefName===name)&&name!=='公立')continue;assert.ok(!m.has(name));if(type==='fitness'){assert.ok(cells.length>=17);m.set(name,{participants:Number(cells[1].replaceAll(',','')),mean:Number(cells[10]),sourceLine:l.trim()});}else{assert.equal(cells.length,17);assert.ok(cells.slice(1).every(c=>/^\d+\.\d%$/.test(c)));const rates=cells.slice(1).map(c=>Number(c.replace('%','')));for(const start of [0,4,8,12])near(sum(rates.slice(start,start+4)),100,0.21,'rounded category subtotal');m.set(name,{male:rates[7],female:rates[15],maleZero:rates[4],femaleZero:rates[12],rates,sourceLine:l.trim()});}}assert.equal(m.size,48);return m;}
export function extractFitness(workbook,questionnaire,pdf,method,errata){
 const pages=pdf.split('\f');for(const idx of [0,2,6]){assert.ok(compact(pages[idx]).includes('公立学校都道府県別(指定都市を含む)'));assert.ok(compact(pages[idx]).includes('令和7年度'));assert.ok(compact(pages[idx]).includes('小学校'));}assert.ok(compact(pages[0]).includes('●男子'));assert.ok(compact(pages[2]).includes('●女子'));assert.ok(compact(pages[6]).includes('1週間の総運動時間'));
 for(const t of ['令和7年4月~7月','5年生全員','学校の体育・保健体育の授業以外で','一部のデータ'])assert.ok(compact(method).includes(compact(t)));
 assert.ok(compact(errata).includes('P203'));assert.ok(compact(errata).includes('大阪')); // Published corrections concern middle-school excluded-city partitions; the selected elementary inclusive table is unchanged.
 const sh=workbook.getWorksheet('体力合計点'),participants=workbook.getWorksheet('調査校数と児童数');assert.equal(cell(sh,'A1'),'実技　〔体力合計点〕');assert.ok(compact(cell(sh,'J2')).includes('公立学校都道府県別(指定都市を含む)'));assert.equal(cell(sh,'K4'),'標本数');assert.equal(cell(sh,'L4'),'平均値');assert.equal(cell(sh,'N4'),'標本数');assert.equal(cell(sh,'O4'),'平均値');assert.equal(cell(sh,'A7'),'公立');
 const pm=pdfRows(pages[0],'fitness'),pf=pdfRows(pages[2],'fitness'),pa=pdfRows(pages[6],'activity');
 const qmale=questionnaire.getWorksheet('Q5_男子'),qfemale=questionnaire.getWorksheet('Q5_女子');for(const q of[qmale,qfemale]){assert.ok(compact(cell(q,'A4')).includes('学校の体育の授業以外'));assert.ok(compact(cell(q,'A17')).includes('公立学校都道府県別(指定都市を含む)'));assert.equal(cell(q,'I20'),'１週間');}
 const rows=prefectures.map((p,i)=>{
  const r=i+5;assert.equal(cell(sh,'J'+r),p.prefName);assert.equal(cell(participants,'I'+r),p.prefName);const maleN=finite(cell(sh,'K'+r),'male sample'),femaleN=finite(cell(sh,'N'+r),'female sample'),male=finite(cell(sh,'L'+r),'male score'),female=finite(cell(sh,'O'+r),'female score');assert.ok(maleN>0&&femaleN>0&&male<=80&&female<=80);assert.equal(Number(male.toFixed(2)),pm.get(p.prefName).mean);assert.equal(Number(female.toFixed(2)),pf.get(p.prefName).mean);assert.equal(cell(participants,'K'+r),pm.get(p.prefName).participants);assert.equal(cell(participants,'L'+r),pf.get(p.prefName).participants);assert.ok(maleN<=pm.get(p.prefName).participants&&femaleN<=pf.get(p.prefName).participants);
  const qr=i+21;for(const q of[qmale,qfemale])assert.equal(cell(q,'A'+qr),p.prefName);const a=pa.get(p.prefName);assert.equal(Number(((1-cell(qmale,'I'+qr))*100).toFixed(1)),a.maleZero);assert.equal(Number(((1-cell(qfemale,'I'+qr))*100).toFixed(1)),a.femaleZero);
  return{areaCode:p.prefCode,areaName:p.prefName,values:{'elementary5-fitness-score-male':male,'elementary5-fitness-score-female':female,'elementary5-weekly-exercise-420min-rate-male':a.male,'elementary5-weekly-exercise-420min-rate-female':a.female},sampleSizes:{fitnessMale:maleN,fitnessFemale:femaleN,participantsMale:pm.get(p.prefName).participants,participantsFemale:pf.get(p.prefName).participants},activityDistribution:a.rates,sourceRow:r};
 });
 const national={};for(const sex of ['male','female']){const nCol=sex==='male'?'B':'E',meanCol=sex==='male'?'C':'F';const N=sum(rows.map(r=>r.sampleSizes[sex==='male'?'fitnessMale':'fitnessFemale']));assert.equal(N,cell(sh,nCol+'7'));const mean=sum(rows.map(r=>r.values['elementary5-fitness-score-'+sex]*r.sampleSizes[sex==='male'?'fitnessMale':'fitnessFemale']))/N;near(mean,cell(sh,meanCol+'7'),1e-7,'weighted public national mean');national['elementary5-fitness-score-'+sex]={value:cell(sh,meanCol+'7'),sampleSize:N,scope:'公立'};national['elementary5-weekly-exercise-420min-rate-'+sex]={value:pa.get('公立')[sex],scope:'公立',aggregation:'原表公立行。県別有効回答数が当該PDFに無いため加重再計算しない'};}
 assert.equal(sum(rows.map(r=>r.sampleSizes.participantsMale)),464664);assert.equal(sum(rows.map(r=>r.sampleSizes.participantsFemale)),448480);assert.ok(compact(method).includes('公立920,411464,664448,48099.2%'));
 return{rows,national,participation:{targetPublicPupils:920411,participantsMale:464664,participantsFemale:448480,officialPupilParticipationRate:99.2,participationIsNotCompleteScoreCoverage:true},checks:{prefectures:47,scorePdfMatchedValues:94,participantPdfMatchedValues:94,scoreNationalSampleSumMatches:2,scoreWeightedNationalMeanMatches:2,activityZeroRateXlsxMatches:94,activityRoundedCategorySums:47*4,activityNationalReweighted:false,missing:0,duplicates:0}};
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
  const run = promisify(execFile);
  const pdf = async (id) => (await run('pdftotext', ['-layout', sourceFiles[id].path, '-'], { encoding: 'utf8', maxBuffer: 8 * 1024 * 1024 })).stdout;
  const load = async (id) => { const w = new ExcelJS.Workbook(); await w.xlsx.load(sourceFiles[id].bytes); return w; };
  const screening = extractScreening({ screening: await load('screening'), guidance: await load('guidance'), metabolic: await load('metabolic') }, sourceFiles['screening-index'].bytes.toString('utf8'), await pdf('screening-national'));
  const fitness = extractFitness(await load('fitness-elementary'), await load('fitness-elementary-questionnaire'), await pdf('fitness-prefectures'), await pdf('fitness-method'), await pdf('fitness-errata'));
  return { screening, fitness };
}
export function buildOutputs(extracted, registry, generatedAt) {
  return FIELDS.map(({ key, group, unit, year, sourceUrl }) => {
    const config = registry[key]; assert.ok(config?.isActive && config.unit === unit && config.yearFormat === 'fiscal', `${key}: config mismatch`);
    assert.ok(config.source.kind === 'external' && config.source.fetcherKey === 'manual'); assert.equal(config.source.config.provenance.url, sourceUrl);
    assert.deepEqual(config.years, { from: Number(year), to: Number(year) });
    const rows = extracted[group].rows.map(({ areaCode, areaName, values }) => ({ areaCode, areaName, value: values[key], unit, yearCode: year, yearName: `${year}年度` }));
    const payload = parseStatsValuesPayload({ metricKey: key, entityKind: 'prefecture', rows, meta: { generatedAt, rowCount: 47, areaCount: 47, yearRange: [year, year], recipe: buildRecipe(config) } });
    const content = JSON.stringify(payload); return { key: `app/stats/${key}/values.json`, metricKey: key, sha256: sha(content), sourceMatchedRows: rows.length, content };
  });
}
async function main() {
  const { values: options } = parseArgs({ options: {
    'write-local': { type: 'boolean', default: false },
    'source-dir': { type: 'string', default: '/tmp/stats47-screening-child-fitness-source' },
    out: { type: 'string', default: '.local/verification/themes/screening-child-fitness-source.json' },
    help: { type: 'boolean', default: false },
  } });
  if (options.help) { console.log('Verify 3 specific-checkup rates and 4 public elementary grade-5 indicators. Requires pdftotext; --write-local writes canonical local stats only. No remote writes.'); return; }
  const sourceFiles = {}; for (const [id, spec] of Object.entries(SOURCES)) sourceFiles[id] = await readSource(spec, options['source-dir']);
  const extracted = await extractAll(sourceFiles); const generatedAt = new Date().toISOString(); const outputs = buildOutputs(extracted, METRICS_REGISTRY, generatedAt);
  // Validate all payloads before any stats write.
  if (options['write-local']) for (const output of outputs) { const path = resolve(root, '.local/r2', output.key); await mkdir(dirname(path), { recursive: true }); await writeFile(path, output.content); }
  const report = {
    generatedAt, status: options['write-local'] ? 'source-verified-staged' : 'source-verified', sources: SOURCES,
    checks: { screening: extracted.screening.checks, fitness: extracted.fitness.checks },
    screening: { prefectureAggregate: extracted.screening.prefectureAggregate, officialNational: extracted.screening.officialNational, differences: extracted.screening.differences },
    fitness: { nationalPublic: extracted.fitness.national, participation: extracted.fitness.participation },
    files: outputs.map(({ content, ...file }) => file),
    limitations: [
      '特定健診の県対象者数は人口に基づく推計。県別は郵便番号不明除外・精査があり、全国の別公表値と同一母集団ではない。県の割合を単純平均して全国率とはしない。',
      '体力・運動時間は公立小学5年生の指定都市を含む県別。有効標本が項目で異なる。実施率99.2%は全項目の完全回答率ではない。中2と国私立は含めない。',
      '週420分以上割合は公式PDFの小数1桁。県別有効回答数がないため全国値の加重再計算はせず、公立全国行を使用。',
      '学校体育施設の2025時点の整備状況はこの4系列に含まない。既存学校屋内運動場設置率は2006年止まりで現況の代用にしない。',
    ],
  };
  const out = resolve(root, options.out); await mkdir(dirname(out), { recursive: true }); await writeFile(out, JSON.stringify(report, null, 2) + '\n');
  console.log(JSON.stringify({ metrics: outputs.length, values: 329, output: out }));
}
if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch((error) => { console.error(error); process.exitCode = 1; });
