import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { jstDateOf, resolvePeriods, addDays } from '../../metrics/lib/periods.mjs';
import { reviewDue, selectKeyword, recordDeployment, validateSnapshot } from '../lib/keyword-cycle.mjs';
import { appendHistory, runCycle, pageFragment } from '../keyword-cycle.mjs';
import { applyTextPatches, validateReview } from '../keyword-review.mjs';
import { fetchSnapshot } from '../fetch-keyword-ranks.mjs';
import { capturePage, validatePageEvidence } from '../keyword-page.mjs';
import yaml from 'js-yaml';

const today = jstDateOf(), periods = resolvePeriods({source:'gsc'});
const row = (keyword, rank = 4, impressions = 100) => ({ keyword, targetPath: `/ranking/${keyword}`, rank, impressions, clicks:0 });
const snapshot = rows => ({siteUrl:'sc-domain:stats47.jp', asOf:today,
  current:{period:periods.finalized7d,dataState:'final',coverage:{status:'complete'},rows},
  previous:{period:periods.previous7d,dataState:'final',coverage:{status:'complete'},rows:[]}});
const emptyLog = () => ({schemaVersion:1,entries:[]});
const observing = (keyword, age = 12) => ({...row(keyword),status:'observing',nextReviewDate:addDays(today,7-age),
  actions:[{date:addDays(today,-age),rankAtAction:4.2,method:'title',deployment:{sha:'a'.repeat(40)}}]});

test('finalized windows contain exactly 7 days; 28-day and incomplete inputs are rejected', () => {
  const data=snapshot([]); validateSnapshot(data);
  data.current.period=periods.rolling28d; assert.throws(()=>validateSnapshot(data));
  data.current.period=periods.finalized7d; data.current.coverage.status='partial'; assert.throws(()=>validateSnapshot(data));
});
test('due review uses unrounded position and leaves incomplete post-publication data observing', () => {
  const log={schemaVersion:1,entries:[observing('win'),observing('better'),observing('same'),observing('worse'),observing('missing'),observing('early',7),observing('cool',2)]};
  const data=snapshot([row('win',1),row('better',1.01),row('same',4.2),row('worse',5),row('early',1),row('cool',1)]);
  const result=reviewDue(log,data);
  assert.deepEqual(result.log.entries.map(e=>e.status),['achieved','active','active','active','observing','observing','observing']);
  assert.equal(result.log.entries[1].lastReview.outcome,'improved');
  assert.equal(result.log.entries[3].lastReview.outcome,'no-improvement');
  assert.equal(log.entries[0].status,'observing','input history was not mutated');
});
test('selection follows the requested priority and excludes achieved, cooldown and pending pages', () => {
  const rows=[row('near',2),row('far',9,1000),row('second',12,3000),row('new-query',3,5000)];
  const keywords={keywords:rows.slice(0,3)};
  assert.equal(selectKeyword({keywords,log:emptyLog(),snapshot:snapshot(rows)}).keyword,'near');
  const log={schemaVersion:1,entries:[observing('near'),{...row('far'),status:'achieved',actions:[]}]};
  assert.equal(selectKeyword({keywords,log,snapshot:snapshot(rows)}).keyword,'second');
  assert.equal(selectKeyword({keywords,log,snapshot:snapshot(rows),pending:[row('second')]}).keyword,'new-query');
});
test('no-effect retry uses a different method; missing high-priority and no-candidate behavior are explicit', () => {
  const retry={...row('retry'),status:'active',actions:[{method:'title'}],lastReview:{outcome:'no-improvement'}};
  const selected=selectKeyword({keywords:{keywords:[row('missing')]},log:{schemaVersion:1,entries:[retry]},snapshot:snapshot([])});
  assert.equal(selected.keyword,'retry'); assert.equal(selected.previousMethod,'title');
  assert.equal(selectKeyword({keywords:{keywords:[row('missing')]},log:emptyLog(),snapshot:snapshot([])}),null);
  assert.equal(selectKeyword({keywords:{keywords:[{...row('missing'),priority:'high'}]},log:emptyLog(),snapshot:snapshot([])}).rank,null);
});
test('observation starts at verified publication, with exactly seven days cooldown and idempotency', () => {
  const proposal={id:'123-1',...row('x'),needs:'needs',done:'done',method:'description',files:[]};
  const deployment={date:today,sha:'a'.repeat(40),runUrl:'https://github.com/uruhayato373/stats47/actions/runs/1'};
  const log=recordDeployment(emptyLog(),proposal,snapshot([row('x')]),deployment);
  assert.equal(log.entries[0].status,'observing'); assert.equal(log.entries[0].nextReviewDate,addDays(today,7));
  assert.deepEqual(recordDeployment(log,proposal,snapshot([row('x')]),deployment),log);
  assert.throws(()=>recordDeployment(log,{...proposal,id:'124-1'},snapshot([row('x')]),deployment));
});
test('rank history is append-only, verified by hash, and repeated runs never replace a date', t => {
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'keyword-history-')); t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  fs.mkdirSync(path.join(repo,'data/seo'),{recursive:true}); fs.writeFileSync(path.join(repo,'data/seo/rank-history.json'),JSON.stringify({schemaVersion:1,snapshots:[]}));
  appendHistory(repo,snapshot([row('x')]),[row('x')],null);
  const file=path.join(repo,`data/seo/rank-history/${today}.json`), before=fs.readFileSync(file,'utf8');
  appendHistory(repo,snapshot([row('x',1)]),[row('x')],null); assert.equal(fs.readFileSync(file,'utf8'),before);
  fs.writeFileSync(file,'{}'); assert.throws(()=>appendHistory(repo,snapshot([]),[],null),/history changed/);
});
test('trusted text patcher cannot change code, indexing, another survey or page structure', () => {
  const source="const x = { census: { summary: 'old summary' }, other: { summary: 'another summary' } };";
  const patch={property:'summary',oldText:'old summary',newText:'検索利用者が必要とする年齢別・男女別の定義を説明する。'};
  assert.ok(applyTextPatches(source,[patch],'/survey/census').includes(patch.newText));
  assert.throws(()=>applyTextPatches(source,[{...patch,oldText:'another summary'}],'/survey/census'));
  assert.throws(()=>applyTextPatches(source,[{...patch,property:'robots'}],'/survey/census'));
  assert.throws(()=>applyTextPatches(source,[{...patch,newText:'<script>noindex new structure</script>'}],'/survey/census'));
});
test('a claimed competitor review without actual search/fetch evidence is rejected', () => {
  const entries=[{type:'result',subtype:'success',structured_output:{status:'no-change',keyword:'x',targetPath:'/ranking/x',needs:'検索している人が何を知りたいのかを具体的に記述する。',gap:'現在の内容を読んで不足がないと判断した根拠を述べる。',done:'変更が必要ないため今回のサイト改善は行っていません。',competitors:[{url:'https://example.org/',findings:'比較したページの記述が検索ニーズを満たしている。'}],patches:[]}}];
  assert.throws(()=>validateReview(entries,row('x')),/WebSearch/);
});
test('GSC request contract is query/page plus complete dates, final only, and API errors are not empty success', async () => {
  const calls=[]; const client={searchanalytics:{query:async request=>{calls.push(request.requestBody); const q=request.requestBody;
    const rows=q.dimensions[0]==='date' ? Array.from({length:7},(_,i)=>({keys:[addDays(q.startDate,i)]})) : [{keys:['x','https://stats47.jp/ranking/x'],position:4,impressions:10,clicks:0}];
    return {data:{rows}}; }}};
  const result=await fetchSnapshot(client); assert.equal(result.current.rows[0].rank,4);
  assert.ok(calls.every(c=>c.dataState==='final'&&c.type==='web')); assert.equal(calls.length,4);
  await assert.rejects(fetchSnapshot({searchanalytics:{query:async()=>{throw new Error('API unavailable');}}}));
});

test('same-day reruns cannot choose another keyword after the first enters cooldown', t => {
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'keyword-selection-')); t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  fs.mkdirSync(path.join(repo,'data/seo'),{recursive:true});
  const write=(name,data)=>fs.writeFileSync(path.join(repo,`data/seo/${name}.json`),JSON.stringify(data));
  write('keywords',{schemaVersion:1,keywords:[row('a'),row('b')]}); write('improvement-log',emptyLog()); write('rank-history',{schemaVersion:1,snapshots:[]});
  const data=snapshot([row('a',2),row('b',3)]);
  assert.equal(runCycle(repo,data).selected.keyword,'a');
  write('improvement-log',{schemaVersion:1,entries:[observing('a',2)]});
  assert.equal(runCycle(repo,data).selected,null);
});

test('survey cooldown compares only the observed page, not the other surveys in its shared file', () => {
  const before="const x = { census: { summary: 'census' }, other: { summary: 'other' } };";
  assert.equal(pageFragment(before,'/survey/census'),pageFragment(before.replace("'other'","'updated'"),'/survey/census'));
  assert.notEqual(pageFragment(before,'/survey/census'),pageFragment(before.replace("'census'","'updated'"),'/survey/census'));
});

test('review requires real successful search/read records and cannot rename a failed method', () => {
  const report={status:'proposed',keyword:'x',targetPath:'/ranking/x',needs:'検索する人が知りたい地域の違いと対象年を具体的に説明する。',gap:'現在の説明に対象年が書かれておらず検索ニーズを満たしていない。',done:'タイトルに対象年を明示して指標の読み違いを防ぐ説明に変更する。',method:'title',competitors:[{url:'https://example.org/',findings:'比較ページには対象年と地域範囲が明記されている。'}],patches:[{property:'seoTitle',oldText:'old',newText:'年齢別の地域差と対象年を確認できる統計ランキング'}]};
  const uses=[{id:'s',name:'WebSearch',input:{query:'x'}},{id:'c',name:'WebFetch',input:{url:'https://example.org/'}},{id:'t',name:'WebFetch',input:{url:'https://stats47.jp/ranking/x'}}];
  const entries=[{message:{content:uses.map(u=>({type:'tool_use',...u}))}},{message:{content:uses.map(u=>({type:'tool_result',tool_use_id:u.id,is_error:false}))}},{type:'result',subtype:'success',structured_output:report}];
  assert.equal(validateReview(entries,row('x')).status,'proposed');
  assert.throws(()=>validateReview(entries,{...row('x'),previousMethod:'title',previousMethods:['title']}));
  report.method='content'; assert.throws(()=>validateReview(entries,row('x')),/actual changed property/);
  report.method='title'; entries[1].message.content[0].is_error=true;
  assert.throws(()=>validateReview(entries,row('x')),/WebSearch/);
  entries[1].message.content[0].is_error=false;
  entries[1].message.content[2].content='Request failed with status code 403';
  assert.throws(()=>validateReview(entries,row('x')),/target page not read/);
  entries[0].message.content.push({type:'tool_use',id:'read',name:'Read',input:{file_path:'/workspace/.local/seo-rank-watch/target-page.txt'}});
  entries[1].message.content.push({type:'tool_result',tool_use_id:'read',content:'Verified public body'});
  assert.equal(validateReview(entries,row('x'),{textFile:'.local/seo-rank-watch/target-page.txt'}).status,'proposed');
});

test('public page evidence rejects HTTP errors, stale selection and tampered body', async t => {
  const repo=fs.mkdtempSync(path.join(os.tmpdir(),'keyword-page-')); t.after(()=>fs.rmSync(repo,{recursive:true,force:true}));
  const input={selected:row('x'),inputHash:'current-selection'};
  await assert.rejects(capturePage(repo,input,async()=>new Response('Forbidden',{status:403})),/unavailable/);
  const html='<html><head><title>公開ページ</title></head><body><main><h1>見出し</h1><p>公開された本文</p><script>not visible</script><a href="/ranking/x">詳細</a></main></body></html>';
  const result=await capturePage(repo,input,async()=>new Response(html,{headers:{'content-type':'text/html'}}));
  assert.ok(fs.readFileSync(path.join(repo,result.textFile),'utf8').includes('詳細: /ranking/x'));
  assert.ok(!fs.readFileSync(path.join(repo,result.textFile),'utf8').includes('not visible'));
  validatePageEvidence(repo,input);
  assert.throws(()=>validatePageEvidence(repo,{...input,inputHash:'other'}));
  fs.writeFileSync(path.join(repo,result.textFile),'made-up content');
  assert.throws(()=>validatePageEvidence(repo,input));
});

test('CI commits measurements before read-only research and creates only tested draft PRs', () => {
  const workflow=yaml.load(fs.readFileSync(new URL('../../../../.github/workflows/seo-keyword-cycle-daily.yml',import.meta.url),'utf8'));
  const steps=workflow.jobs.cycle.steps;
  assert.equal(workflow.on.schedule[0].cron,'15 1 * * *');
  assert.match(workflow.jobs.cycle.if,/workflow_run.conclusion == 'success'/);
  const model=steps.findIndex(s=>s.id==='review');
  assert.ok(steps.findIndex(s=>s.name==='Commit measurements before review')<model);
  assert.ok(steps.findIndex(s=>s.name==='Capture selected public page with HTTP evidence')<model);
  assert.match(steps[model].with.claude_args,/--tools "Read,Glob,Grep,WebFetch,WebSearch"/);
  assert.doesNotMatch(steps[model].with.claude_args,/--tools "[^"]*(?:Bash|Edit|Write)/);
  assert.match(steps.find(s=>s.name==='Fetch finalized seven-day GSC ranks').run,/--days 7/);
  const publish=steps.find(s=>s.name==='Create draft keyword PR');
  assert.match(publish.if,/success\(\).*proposal.outcome == 'success'/);
  assert.match(publish.run,/--draft --base develop/); assert.doesNotMatch(publish.run,/gh pr merge|push origin main/);
  assert.ok(steps.indexOf(publish)>steps.findIndex(s=>s.name==='Verify proposed implementation'));
});
