import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { ROOT,FILES,workspaceItems,readQuality,saveReview,imageLibrary,saveImagePlan,registerCandidate,reviewCandidate,readTemplates,saveTemplate,sha,storeVerified,candidateKey,inputKey,validateQuality } from '../lib/workspace.mjs';
import { archiveSnsImage } from '../lib/storage.mjs';

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
 const root=fixture(t),image=imageLibrary(root).images.find(x=>x.kind!=='cover');
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
