#!/usr/bin/env node
/** Copy exact existing images into private R2. Never remove originals or change public posts. */
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { ROOT,sha } from './lib/workspace.mjs';
import { archiveSnsImage,mediaStore,readVerified } from './lib/storage.mjs';
import { resolveDriveRoot,driveAbsolutePath } from '../sns/lib/sns-drive-assets.mjs';
import { createR2Store,fetchCoverSource } from '../note/lib/cover-storage.mjs';
import { R2_BUCKET,R2_PUBLIC_BASE_URL } from '../lib/site-config.cjs';
import { datasetPath } from '../../../config/datasets.mjs';
const require=createRequire(import.meta.url),store=require('../lib/sns-posts-store.cjs');
const args=process.argv.slice(2);
if(args.some(a=>!['--apply','--all','--ids','--verify-existing'].includes(a)&&args[args.indexOf(a)-1]!=='--ids'))throw Error('Unknown argument');
const ids=args.includes('--ids')?args[args.indexOf('--ids')+1].split(',').map(Number):null;
if(!ids&&!args.includes('--all'))throw Error('Use --all or --ids. --apply copies verified objects.');
let driveRoot=null;try{driveRoot=await resolveDriveRoot();}catch{/* Stored R2/source candidates may still be usable. */}
const rows=store.loadAll().filter(p=>p.platform!=='note'&&(!ids||ids.includes(p.id)));
const targets=rows.flatMap(p=>(p.assets??[]).filter(a=>a.state==='archived'&&(!a.r2||args.includes('--verify-existing'))&&a.mime?.startsWith('image/')).map(a=>({post:p,asset:a})));
const results=[],queue=[...targets],sourceStore=createR2Store({bucket:R2_BUCKET}),destination=mediaStore();
async function sourceBytes(post,asset){
  const candidates=[asset.source,post.media_path].filter(Boolean);
  if(driveRoot&&asset.drive_path){const file=driveAbsolutePath(driveRoot,asset.drive_path);if(fs.existsSync(file)){const b=fs.readFileSync(file);if(sha(b)===asset.sha256)return b;}}
  let mismatched=false;
  for(const candidate of [...new Set(candidates)]){
    let bytes=null;
    const rel=candidate.replace(/^\.local\/r2\//,'').replace(/^\.\//,'');
    if(rel.startsWith('sns/'))bytes=await sourceStore.get(rel);
    else if(candidate.startsWith(R2_PUBLIC_BASE_URL+'/'))bytes=await sourceStore.get(candidate.slice(R2_PUBLIC_BASE_URL.length+1));
    else if(/^https:\/\/assets\.st-note\.com\//.test(candidate))bytes=await fetchCoverSource(candidate);
    else if(!path.isAbsolute(candidate)&&!candidate.split(/[\\/]/).includes('..')){
      const file=path.join(ROOT,candidate);if(fs.existsSync(file)&&fs.statSync(file).isFile())bytes=fs.readFileSync(file);
    }
    if(bytes&&sha(bytes)===asset.sha256&&bytes.length===asset.bytes)return bytes;
    if(bytes)mismatched=true;
  }
  return {status:mismatched?'source-mismatch':'source-unavailable'};
}
await Promise.all(Array.from({length:4},async()=>{
  while(queue.length){
    const {post,asset}=queue.shift();let result;
    try{
      if(asset.r2){
        await readVerified({...asset,...asset.r2});
        result={status:'migrated',sha256:asset.sha256,key:asset.r2.key};
      }else{
      const bytes=await sourceBytes(post,asset);
      if(!Buffer.isBuffer(bytes)){result=bytes;}
      else if(!args.includes('--apply'))result={status:'ready'};
      else{
        const next=await archiveSnsImage({platform:post.platform,id:post.id,role:asset.role,order:asset.order,bytes,mime:asset.mime,source:asset.source,drivePath:asset.drive_path},destination);
        const current=store.getById(post.id),found=current.assets.find(a=>a.role===asset.role&&a.order===asset.order);
        if(sha(found)!==sha(asset))throw Error('ledger-changed');
        store.updateById(post.id,{assets:current.assets.map(a=>a===found?{...a,...next}:a)});
        result={status:'migrated',sha256:next.sha256,key:next.r2.key};
      }
      }
    }catch(error){
      // A derived log failure can follow a successful ledger write. Re-read exact references before reporting.
      const current=store.getById(post.id)?.assets?.find(a=>a.role===asset.role&&a.order===asset.order);
      if(current?.r2&&current.sha256===asset.sha256){
        try{await readVerified({...current,...current.r2});result={status:'migrated',sha256:current.sha256,key:current.r2.key};}catch{/* Retain unverified. */}
      }
      result??={status:'unverified',reason:error.code??'verification-failed'};
    }
    results.push({postId:post.id,platform:post.platform,role:asset.role,order:asset.order,...result});
    if(results.length%25===0)console.log(JSON.stringify({processed:results.length,total:targets.length,migrated:results.filter(r=>r.status==='migrated').length}));
  }
}));
const reportPath=path.join(ROOT,datasetPath('content.image-migration'));
const previous=fs.existsSync(reportPath)?JSON.parse(fs.readFileSync(reportPath,'utf8')).results:[];
const combined=new Map(previous.map(r=>[[r.postId,r.role,r.order].join('/'),r]));
for(const row of results)combined.set([row.postId,row.role,row.order].join('/'),row);
const report={schemaVersion:1,observedAt:new Date().toISOString(),applied:args.includes('--apply'),driveMounted:!!driveRoot,results:[...combined.values()].sort((a,b)=>a.postId-b.postId||a.order-b.order)};
if(args.includes('--apply'))fs.writeFileSync(reportPath,JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({total:results.length,counts:Object.fromEntries([...new Set(results.map(r=>r.status))].map(s=>[s,results.filter(r=>r.status===s).length]))}));
if(results.some(r=>r.status==='unverified'))process.exitCode=2;
