import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT,FILES,workspaceItems,readQuality,saveReview,imageLibrary,saveImagePlan,registerCandidate,reviewCandidate,readTemplates,saveTemplate,sha,storeVerified,candidateKey,inputKey,validateQuality } from '../lib/workspace.mjs';
import { archiveSnsImage,readMediaObject } from '../lib/storage.mjs';
import { WEB_INVENTORY,WEB_PARTS,readWebInventory,writeWebInventory,publicRef,imageReferences,inlineSvgReferences,publicUrlAllowed } from '../lib/web-inventory.mjs';
import { assertStaticSvg } from '../lib/svg-safety.mjs';
import { snsImageTemplate } from '../lib/catalog.mjs';
import { roleForTemplate } from '../lib/classification.mjs';
import { saveImagePolicy, assessImage } from '../lib/workspace.mjs';

test('SNS classification uses asset evidence and excludes non-chart carousel slides',()=>{
 assert.equal(snsImageTemplate({template:'shock'},{source:'sns/ranking/a/x/stills/all47.png'}),'ranking');
 assert.equal(snsImageTemplate({template:'number'},{width:1080,height:1350}),'unclassified');
 assert.equal(snsImageTemplate({template:'correlation-carousel'},{source:'slide-2-scatter-1080x1350.png'}),'correlation');
 for(const template of ['ranking','household-receipt','rank-routes','buzz-map']) {
  assert.equal(snsImageTemplate({template},{source:'slide-1-cover-1080x1350.png'}),'title-card');
  assert.equal(snsImageTemplate({template},{source:'slide-3-source-1080x1350.png'}),'source-card');
 }
 assert.equal(snsImageTemplate({template:'tile-change'},{source:'slide-2-detail.png'}),'time-series');
 assert.equal(snsImageTemplate({template:'household-receipt'},{source:'slide-2-detail.png'}),'household');
 assert.equal(snsImageTemplate({template:'ranking'},{source:'choropleth-map-1200x630.png'}),'map');
});

test('SNS inventory carries recorded dimensions and keeps manual template ownership',t=>{
 const root=fixture(t),image=imageLibrary(root).images.find(i=>i.channel==='instagram'&&i.templateId==='correlation');
 assert.ok(image);assert.equal(image.width,1080);assert.equal(image.height,1350);
 saveImagePlan(root,image.id,image.revision,{templateId:'procedure',policy:'人が確認した割り当て',role:'diagram',reason:'手順の図と確認'});
 assert.equal(imageLibrary(root).images.find(i=>i.id===image.id).templateId,'procedure');
});

function fixture(t){
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'stats47-media-test-'));
 for(const rel of [...Object.values(FILES),'data/note/articles.json','data/note/magazines.json','data/note/cover-assets.json','data/sns/posts.json']){
  fs.mkdirSync(path.dirname(path.join(root,rel)),{recursive:true});fs.copyFileSync(path.join(ROOT,rel),path.join(root,rel));
 }
 fs.writeFileSync(path.join(root,FILES.quality),JSON.stringify({schemaVersion:1,reviews:{},images:{}}));
 t.after(()=>fs.rmSync(root,{recursive:true,force:true}));return root;
}
function candidate(image){
 const imageSha=sha('image'),inputSha=sha('input');
 return {id:sha([imageSha,inputSha]),basis:image.basis,
 storage:{provider:'r2-private',bucket:'stats47-private',key:candidateKey(imageSha,'png'),sha256:imageSha,bytes:5},
 input:{provider:'r2-private',bucket:'stats47-private',key:inputKey(inputSha),sha256:inputSha,bytes:5},width:1200,height:630,createdAt:'2026-10-16T00:00:00Z',review:null};
}
function confirmed(root,image,type=image.templateId==='unclassified'?'ranking':image.templateId){
 saveImagePlan(root,image.id,image.revision,{templateId:type,policy:image.policy,role:roleForTemplate(type),reason:'試験用固定画像の型を照合'});
 return imageLibrary(root).images.find(i=>i.id===image.id);
}
test('all note records are visible including unavailable bodies; metrics do not invalidate reviews',t=>{
 const root=fixture(t),items=workspaceItems(root);
 assert.equal(items.filter(x=>x.channel==='note').length,495);
 assert.ok(items.some(x=>x.bodyStore==='note-only'&&!x.bodySaved));
 const item=items.find(x=>x.channel==='x');
 const file=path.join(root,'data/sns/posts.json'),posts=JSON.parse(fs.readFileSync(file));
 posts.posts.find(p=>'sns/'+p.id===item.id).impressions=1234;fs.writeFileSync(file,JSON.stringify(posts));
 assert.equal(workspaceItems(root).find(x=>x.id===item.id).basis,item.basis);
});
test('review save preserves unreviewed dimensions and rejects stale writers',t=>{
 const root=fixture(t),item=workspaceItems(root)[0];
 const review={...item.review,policy:'図の文字を大きくする',checks:{...item.review.checks,images:'issue'}};
 saveReview(root,item.id,item.revision,review);
 const next=workspaceItems(root).find(x=>x.id===item.id);assert.equal(next.reviewState,'issue');assert.equal(next.review.checks.links,'unchecked');
 assert.throws(()=>saveReview(root,item.id,item.revision,review),/再読込/);
});
test('content changes make an earlier review stale',t=>{
 const root=fixture(t),item=workspaceItems(root).find(x=>x.channel==='x');
 saveReview(root,item.id,item.revision,item.review);
 const file=path.join(root,'data/sns/posts.json'),posts=JSON.parse(fs.readFileSync(file));posts.posts.find(p=>'sns/'+p.id===item.id).caption+=' updated';fs.writeFileSync(file,JSON.stringify(posts));
 assert.equal(workspaceItems(root).find(x=>x.id===item.id).reviewState,'stale');
});
test('image policy/template changes invalidate exact candidate approval',t=>{
 const root=fixture(t),image=confirmed(root,imageLibrary(root).images.find(x=>x.kind!=='cover'));
 registerCandidate(root,image.id,image.revision,candidate(image));
 let next=imageLibrary(root).images.find(x=>x.id===image.id);
 assert.throws(()=>reviewCandidate(root,next.id,next.revision,next.candidate.id,{status:'pass',reason:'確認',original:true,mobile:false,data:true}),/スマホ/);
 reviewCandidate(root,next.id,next.revision,next.candidate.id,{status:'pass',reason:'原寸と320pxで値を照合',original:true,mobile:true,data:true});
 next=imageLibrary(root).images.find(x=>x.id===image.id);assert.equal(next.approved,true);
 const template=readTemplates(root).templates.find(x=>x.id===next.templateId);
 saveTemplate(root,template.id,sha(template),{policy:'新しい方針',profiles:template.profiles});
 next=imageLibrary(root).images.find(x=>x.id===image.id);assert.equal(next.candidateMatches,false);assert.equal(next.approved,false);
 assert.throws(()=>reviewCandidate(root,next.id,next.revision,next.candidate.id,{status:'pass',reason:'再利用',original:true,mobile:true,data:true}),/再確認/);
});
test('cover workflow cannot be bypassed using generic image registration',t=>{
 const root=fixture(t),image=imageLibrary(root).images.find(x=>x.kind==='cover');
 assert.throws(()=>saveImagePlan(root,image.id,image.revision,{templateId:'map',policy:'x'}),/カバー/);
 assert.throws(()=>registerCandidate(root,image.id,image.revision,candidate(image)),/カバー/);
});
test('R2 readback mismatch prevents a successful archive; repeated bytes are idempotent',async()=>{
 const values=new Map(),store={get:async k=>values.get(k)??null,put:async(k,v)=>values.set(k,v)};
 const bytes=Buffer.from('fixed bytes'),key=candidateKey(sha(bytes),'png');
 const first=await storeVerified(store,key,bytes);await storeVerified(store,key,bytes);assert.equal(values.size,1);assert.equal(first.sha256,sha(bytes));
 await assert.rejects(()=>storeVerified({get:async()=>Buffer.from('different'),put:async()=>{}},key,bytes),/一致/);
});
test('invalid candidate references and unsafe storage are rejected',()=>{
 assert.throws(()=>validateQuality({schemaVersion:1,reviews:{},images:{'IMG-123456789012345678901234':{templateId:'map',policy:'',revisions:[],candidateId:'a'.repeat(64),approvedId:null}}}),/候補版/);
 assert.throws(()=>validateQuality({schemaVersion:1,reviews:{'../elsewhere':{}},images:{}}),/形式/);
});

test('new SNS images use private R2 with exact post ownership and preserve legacy references',async()=>{
 const values=new Map(),store={get:async k=>values.get(k)??null,put:async(k,v)=>values.set(k,v)};
 const bytes=Buffer.from('immutable image');
 const asset=await archiveSnsImage({platform:'x',id:123,role:'image',order:1,bytes,mime:'image/png',drivePath:'SNS素材/x/123/image-1.png'},store);
 assert.equal(asset.r2.key,'sns-assets/x/123/image-1/'+sha(bytes)+'.png');
 assert.equal(asset.r2.bucket,'stats47-private');assert.equal(asset.drive_path,'SNS素材/x/123/image-1.png');
 await assert.rejects(()=>archiveSnsImage({platform:'other-account',id:123,role:'image',order:1,bytes,mime:'image/png'},store),/identity/);
});

test('web and SVG catalog share image review, inputs and cross-page usages',t=>{
 const root=fixture(t),file=path.join(root,WEB_INVENTORY),original=publicRef('app/blog/example/data/chart.svg',Buffer.from('svg'));
 const items=['example','other'].map(key=>({id:'web/blog/'+key,channel:'web',key,title:key,category:'blog',basis:sha(key),url:'https://stats47.jp/blog/'+key}));
 const input={name:'chart.json',...publicRef('app/blog/example/data/chart.json',Buffer.from('{}')),role:'data'};
 const index={schemaVersion:1,items,images:items.map(item=>({owner:item.id,file:original.key,original,inputFiles:[input],templateId:'svg-bar',usage:'body',format:'svg'})),coverage:[]};
 fs.writeFileSync(file,JSON.stringify(index));
 let image=imageLibrary(root).images.find(i=>i.owner===items[0].id);
 assert.equal(image.relatedImageIds.length,2);assert.equal(image.inputFiles[0].sha256,input.sha256);
 image=confirmed(root,image);
 registerCandidate(root,image.id,image.revision,candidate(image));
 image=imageLibrary(root).images.find(i=>i.id===image.id);
 reviewCandidate(root,image.id,image.revision,image.candidate.id,{status:'pass',reason:'固定値・320pxを照合',original:true,mobile:true,data:true});
 index.images[0].inputFiles=[{...input,sha256:sha('changed')}];
 fs.writeFileSync(file,JSON.stringify(index));
 const changed=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.equal(changed.id,image.id);assert.equal(changed.approved,false);assert.equal(changed.candidateMatches,false);
 const item=workspaceItems(root).find(i=>i.id===items[0].id);
 saveReview(root,item.id,item.revision,{...item.review,policy:'本文中の配置を改善'});
 assert.equal(workspaceItems(root).find(i=>i.id===item.id).review.policy,'本文中の配置を改善');
});

test('existing SVG catalog defaults are versioned in the shared policy ledger',t=>{
 const root=fixture(t),template=readTemplates(root).templates.find(x=>x.id==='svg-scatter');
 saveTemplate(root,template.id,sha(template),{policy:'文字の重なりを確認する',profiles:template.profiles});
 const next=readTemplates(root).templates.find(x=>x.id===template.id);
 assert.equal(next.version,template.version+1);
 assert.throws(()=>saveTemplate(root,template.id,sha(template),{policy:'stale',profiles:template.profiles}),/再読込/);
});

test('actual references include extensionless images and exact inline SVG ranges',()=>{
 const md='# 関係\n![図](data/figure.svg)\n<img src="https://storage.stats47.jp/render?id=1">\n<svg viewBox="0 0 10 10"><text>日本</text></svg>';
 const refs=imageReferences(md,'https://storage.stats47.jp/app/blog/test/');
 assert.equal(refs.length,2);assert.equal(refs[0].heading,'関係');assert.equal(refs[0].line,2);
 const inline=inlineSvgReferences(md)[0];assert.equal(sha(Buffer.from(md.slice(inline.start,inline.end))),inline.sha256);
 assert.equal(publicUrlAllowed('https://storage.stats47.jp/file.svg'),true);
 for(const url of ['http://127.0.0.1/file','https://storage.stats47.jp.evil.test/file','https://x:y@storage.stats47.jp/file'])assert.equal(publicUrlAllowed(url),false);
});

test('SVG candidates reject executable and externally loaded resources before rendering',()=>{
 assert.doesNotThrow(()=>assertStaticSvg(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>')));
 for(const child of ['<script>alert(1)</script>','<image href="https://example.com/a"/>','<rect onload="run()"/>','<style>@import "https://example.com/a";</style>','<foreignObject/>']){
  assert.throws(()=>assertStaticSvg(Buffer.from('<svg>'+child+'</svg>')));
 }
});

test('local originals verify hashes and never escape material roots',async t=>{
 const root=fixture(t),bytes=Buffer.from('<svg/>'),rel='assets/fixture.svg';
 fs.mkdirSync(path.join(root,'assets'),{recursive:true});fs.writeFileSync(path.join(root,rel),bytes);
 assert.deepEqual(await readMediaObject(root,{provider:'git',path:rel,sha256:sha(bytes),bytes:bytes.length}),bytes);
 await assert.rejects(()=>readMediaObject(root,{provider:'git',path:'data/note/articles.json'}),/パス/);
 await assert.rejects(()=>readMediaObject(root,{provider:'git',path:rel,sha256:sha('changed'),bytes:bytes.length}),/変わりました/);
});

test('partitioned inventory restores all uses and rejects a partial update',t=>{
 const root=fixture(t),item={id:'web/blog/test',title:'test'},image={owner:item.id,file:'test.svg'};
 writeWebInventory(root,{items:[item],images:[image],coverage:[],updatedAt:'first'});
 assert.deepEqual(readWebInventory(root).images,[image]);
 const file=path.join(root,WEB_INVENTORY),index=JSON.parse(fs.readFileSync(file));
 fs.writeFileSync(path.join(root,WEB_PARTS,index.parts[0].file),'{}');
 index.updatedAt='changed';fs.writeFileSync(file,JSON.stringify(index));
 assert.throws(()=>readWebInventory(root),/incomplete/);
 writeWebInventory(root,{items:[item],images:[image],coverage:[],updatedAt:'complete'});
 assert.deepEqual(readWebInventory(root).items,[item]);
});

test('classification persists, records history and invalidates only when original evidence changes',t=>{
 const root=fixture(t),before=imageLibrary(root).images.find(i=>i.channel==='instagram'&&i.original?.sha256&&i.kind!=='cover');
 const coverBytes=fs.readFileSync(path.join(root,'data/note/cover-assets.json'));
 let image=confirmed(root,before,'diagram');
 assert.equal(image.classification.status,'confirmed');
 assert.throws(()=>saveImagePlan(root,image.id,before.revision,{templateId:'ranking',policy:'',role:'chart',reason:'確認'}),/再読込/);
 image=confirmed(root,image,'ranking');
 assert.equal(image.record.classificationHistory.length,1);
 assert.equal(image.record.classificationHistory[0].templateId,'diagram');
 const file=path.join(root,'data/sns/posts.json'),posts=JSON.parse(fs.readFileSync(file));
 const post=posts.posts.find(p=>'sns/'+p.id===image.owner);
 post.caption+=' edited';post.impressions=42;fs.writeFileSync(file,JSON.stringify(posts));
 assert.equal(imageLibrary(root).images.find(i=>i.id===image.id).classification.status,'confirmed');
 const asset=post.assets.find(a=>a.role+'-'+a.order===image.file);asset.sha256=sha('new actual image');
 fs.writeFileSync(file,JSON.stringify(posts));
 const changed=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.equal(changed.classification.status,'stale');assert.ok(changed.tasks.includes('classification'));
 assert.deepEqual(fs.readFileSync(path.join(root,'data/note/cover-assets.json')),coverBytes);
});
test('pending images can record plans, but unknown types and unconfirmed approvals are rejected',t=>{
 const root=fixture(t);let image=imageLibrary(root).images.find(i=>i.templateId==='unclassified'&&i.kind!=='cover');
 saveImagePolicy(root,image.id,image.revision,'元画像を回収してから型を確認する');
 image=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.ok(image.policy.includes('回収'));assert.equal(image.classification.status,'pending');
 assert.throws(()=>saveImagePlan(root,image.id,image.revision,{templateId:'made-up',role:'chart',policy:'',reason:'x'}),/不正/);
 assert.throws(()=>saveImagePlan(root,image.id,image.revision,{templateId:'map',role:'title',policy:'',reason:'x'}),/一致/);
 registerCandidate(root,image.id,image.revision,candidate(image));image=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.throws(()=>reviewCandidate(root,image.id,image.revision,image.candidate.id,{status:'pass',reason:'確認',original:true,mobile:true,data:true}),/分類/);
});
test('maintaining a good existing image needs no new candidate; policy changes reopen review',t=>{
 const root=fixture(t);let image=confirmed(root,imageLibrary(root).images.find(i=>i.original?.sha256&&i.kind!=='cover'),'ranking');
 assessImage(root,image.id,image.revision,{status:'pass',reason:'原寸・320pxで内容を照合',original:true,mobile:true,data:true});
 image=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.equal(image.assessmentMatches,true);assert.ok(image.tasks.includes('kept'));assert.ok(!image.tasks.includes('candidate'));
 saveImagePolicy(root,image.id,image.revision,'文字サイズを変更する');
 image=imageLibrary(root).images.find(i=>i.id===image.id);
 assert.equal(image.assessmentMatches,false);assert.ok(image.tasks.includes('candidate'));
});
test('all covers route to the canonical ledger, and cover policies cannot be saved twice',t=>{
 const root=fixture(t),library=imageLibrary(root),covers=library.images.filter(i=>i.kind==='cover');
 assert.ok(covers.length>0);
 assert.ok(covers.every(i=>i.templateId==='note-cover'&&i.classification.role==='title'&&i.tasks.join()==='cover'&&i.coverManagement));
 for(const id of ['note-cover','unclassified'])assert.throws(()=>saveTemplate(root,id,'x',{policy:'x',profiles:{}}),/制作画面/);
 assert.equal(Object.values(library.classificationSummary.states).reduce((a,b)=>a+b),library.images.length);
});
