#!/usr/bin/env node
/** Read exact note manifests and index file metadata. Never fetch/persist article text in Git. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, FILES, atomicUpdate, safeName } from './lib/workspace.mjs';
import { readArticleLedger } from '../note/lib/article-ledger.mjs';
import { createArticleStores, readManifest, bodyBucket } from '../note/lib/article-store.mjs';
const args = process.argv.slice(2);
if (args.some(a => !['--apply','--all','--keys'].includes(a) && (args[args.indexOf(a)-1] !== '--keys'))) throw Error('Unknown argument');
const keys = args.includes('--keys') ? args[args.indexOf('--keys')+1]?.split(',') : null;
if (!keys && !args.includes('--all')) throw Error('Use --all or --keys key1,key2. --apply saves the index.');
const articles = readArticleLedger(ROOT).articles.filter(a => !keys || keys.includes(a.key));
if (keys?.some(k => !articles.some(a => a.key === k))) throw Error('Unknown article key');
let indexed = 0, unavailable = 0, failed = 0, skipped = 0;
const previous = JSON.parse(fs.readFileSync(path.join(ROOT,FILES.inventory),'utf8'));
const queue = [...articles];
await Promise.all(Array.from({length:4},async()=>{
  while(queue.length){
    const article=queue.shift();
    if(previous.articles[article.key]?.manifestSha===article.body.manifest?.sha256 && previous.articles[article.key]?.status==='indexed'){skipped++;continue;}
    let entry;
    if(!article.body.manifest || article.body.store==='note-only'){
      entry={status:'unavailable',manifestSha:null,files:[],checkedAt:new Date().toISOString()};unavailable++;
    }else{
      try{
        const stores=createArticleStores(article), manifest=await readManifest(article,stores.archive);
        if(manifest.key!==article.key || !Array.isArray(manifest.files) || manifest.files.some(f=>!safeName(f.name)||!/^[a-f0-9]{64}$/.test(f.sha256))) throw Error('Invalid manifest');
        entry={status:'indexed',manifestSha:article.body.manifest.sha256,bucket:bodyBucket(article),files:manifest.files,checkedAt:new Date().toISOString()};indexed++;
      }catch{
        entry={status:'unverified',manifestSha:article.body.manifest.sha256,files:[],checkedAt:new Date().toISOString()};failed++;
      }
    }
    if(args.includes('--apply'))atomicUpdate(ROOT,FILES.inventory,data=>{data.articles[article.key]=entry;data.updatedAt=new Date().toISOString();});
    if((indexed+failed+unavailable)%25===0)console.log(JSON.stringify({indexed,unavailable,failed,skipped}));
  }
}));
console.log(JSON.stringify({indexed,unavailable,failed,skipped,applied:args.includes('--apply')}));
if(failed)process.exitCode=2;
