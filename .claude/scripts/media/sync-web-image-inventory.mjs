#!/usr/bin/env node
/** Rebuild the image index from published page catalogs, exact generation manifests and article references. */
import fs from 'node:fs';
import path from 'node:path';
import { datasetDir } from '../../../config/datasets.mjs';
import { ROOT,sha,safeName } from './lib/workspace.mjs';
import { MATERIAL_ROOTS,readWebInventory,writeWebInventory,publicRef,imageReferences,inlineSvgReferences,sourceReferences } from './lib/web-inventory.mjs';
import { SVG_TEMPLATE } from './lib/catalog.mjs';
import { classify,inspectSvg } from '../lib/svg-classify.mjs';
import { PREF_SILHOUETTE_VARIANTS,OGP_TABS } from '../lib/gallery-collectors.mjs';
import { fetchPublicMediaSource } from '../note/lib/cover-storage.mjs';
import { R2_PUBLIC_BASE_URL as R2,SITE_ORIGIN as SITE } from '../lib/site-config.cjs';
const args=process.argv.slice(2);
if(args.some(a=>!['--apply','--refresh','--all'].includes(a)))throw Error('Use --all [--refresh] [--apply]');
if(!args.includes('--all'))throw Error('--all is required; this inventory never silently samples.');
const previous=readWebInventory(ROOT),oldItems=new Map(previous.items.map(x=>[x.id,x]));
const items=[],images=[],coverage=[],cache=new Map();
const refFile=(name,ref,role='input',state='observed-current')=>({name,...ref,role,state});
async function get(key){
  if(!cache.has(key))cache.set(key,fetchPublicMediaSource(key.startsWith('https:')?key:R2+'/'+key));
  return cache.get(key);
}
function addItem(page) {
  const item={id:'web/'+page.id.replace(':','/'),channel:'web',key:page.key,title:page.title,category:page.kind,status:page.published?'published':'draft',url:SITE+page.href,publishedAt:null,bodyStore:'r2-public',bodySaved:false,basis:sha(page)};
  items.push(item);return item;
}
function addImage(item,file,original,extra={}) {
  const row={owner:item.id,file,original,inputFiles:[],templateId:'unclassified',usage:'body',inventoryStatus:'reference-only',...extra};
  const prior=images.find(x=>x.owner===item.id&&x.file===file);
  if(prior)Object.assign(prior,row);else images.push(row);
  return row;
}
async function manifest(item,key,expected,collection) {
  const rows=expected.map(e=>addImage(item,e.key,publicRef(e.key),{usage:e.usage,templateId:e.templateId,collection}));
  try {
    const bytes=await get(key),m=JSON.parse(bytes);
    if(m.kind!=='stats47-image-generation'||m.entityId!==item.key||!Array.isArray(m.assets))throw Error('manifest contract');
    const prefix=key.slice(0,key.lastIndexOf('/')+1),entityRoot=prefix.replace(/ogp\/$/,'');
    if(m.assets.some(a=>!safeName(a.key)||!a.key.startsWith(entityRoot)||!/^[a-f0-9]{64}$/.test(a.sha256)||!Number.isSafeInteger(a.bytes)||a.bytes<1))throw Error('asset contract');
    const inputFiles=[refFile('generation-manifest.json',publicRef(key,bytes),'generation','preserved-manifest')];
    const upstream=sourceReferences(m.metadata).map(k=>({label:k,url:R2+'/'+k,relationship:'生成記録の参照先（当時の固定値は未照合）'}));
    for(const a of m.assets) {
      const spec=expected.find(e=>e.key===a.key);
      addImage(item,a.key,{...publicRef(a.key),sha256:a.sha256,bytes:a.bytes},{usage:spec?.usage??(/background/.test(a.variant)?'background':'material'),templateId:spec?.templateId??'background',collection:collection==='blog-ogp'&&spec?.usage==='card'?'blog-card':collection,inputFiles,sourceLinks:upstream,
        inventoryStatus:'manifest-indexed',format:a.contentType.split('/')[1],width:a.width,height:a.height,
        generation:{generator:m.generator,renderer:'apps/web/scripts/data/image-generator-registry.ts',rendererHash:m.rendererHash,inputHash:m.inputHash,fingerprint:m.fingerprint,generatedAt:m.generatedAt}});
    }
    return true;
  }catch(e){for(const row of rows)row.missingReason=e.status===404?'生成manifestがありません。画像URLは未照合です。':'生成manifestを照合できません。';return false;}
}
async function blog(item) {
  const prefix='app/blog/'+item.key;
  const ok=await manifest(item,prefix+'/ogp/generation.json',[
    {key:prefix+'/ogp/ogp.png',usage:'ogp',templateId:'ogp'},
    ...['light','dark'].map(v=>({key:prefix+'/thumbnail-'+v+'.webp',usage:'card',templateId:'link-card'}))],'blog-ogp');
  let body;
  try{const bytes=await get(prefix+'/article.md');body=bytes.toString();item.bodySaved=true;item.bodyRef=publicRef(prefix+'/article.md',bytes);item.basis=sha([item.basis,item.bodyRef]);}
  catch{item.inventoryError='本文を取得できず、本文画像の棚卸しが未完了です。';return {manifest:ok,body:false};}
  const refs=imageReferences(body,R2+'/'+prefix+'/'),byUrl=new Map();
  for(const ref of refs){if(!byUrl.has(ref.url))byUrl.set(ref.url,[]);byUrl.get(ref.url).push(ref);}
  for(const [url,occurrences] of byUrl) {
    const key=url.startsWith(R2+'/')?decodeURI(new URL(url).pathname.slice(1)):null;
    const file=key&&safeName(key)?key:url;
    const row=addImage(item,file,key?publicRef(key):{provider:'external',url},{collection:'blog-body',usage:'body',occurrences,inputFiles:[refFile('article.md',item.bodyRef,'article')],format:path.extname(new URL(url).pathname).slice(1)});
    if(!key||!safeName(key)){row.missingReason='外部画像。取得・固定入力の保全は未確認です。';continue;}
    try {
      const bytes=await get(key);row.original=publicRef(key,bytes);row.inventoryStatus='verified';
      if(/\.svg$/i.test(key)){
        const svg=bytes.toString();row.templateId=SVG_TEMPLATE[classify(key.split('/').pop(),svg)];Object.assign(row,inspectSvg(svg));
        row.generation={generator:'svg-builder',renderer:'.claude/scripts/blog/generate-article-charts.ts'};
        const base=key.replace(/(?:-ig)?\.svg$/i,'');
        for(const [suffix,role] of [['.json','data'],['.source.json','provenance']]){
          const sourceKey=base+suffix;
          try{const data=await get(sourceKey);JSON.parse(data);row.inputFiles.push(refFile(sourceKey.split('/').pop(),publicRef(sourceKey,data),role,'preserved-input'));
            if(role==='provenance')row.sourceLinks=sourceReferences(JSON.parse(data)).map(k=>({label:k,url:R2+'/'+k,relationship:'出典manifestの参照先'}));
          }catch{row.missingInputs??=[];row.missingInputs.push(sourceKey);}
        }
      }
    }catch(e){row.inventoryStatus=e.status===404?'missing':'unverified';row.missingReason='本文参照はありますが、画像を取得できません。';}
  }
  return {manifest:ok,body:true};
}
const pagesDir=path.join(ROOT,datasetDir('content.pages'));
const pages=fs.readdirSync(pagesDir).filter(f=>f.endsWith('.json')).flatMap(f=>JSON.parse(fs.readFileSync(path.join(pagesDir,f),'utf8')).pages??[]);
const kinds=['blog','ranking','area','theme','category','product'];
const targets=pages.filter(p=>p.published&&kinds.includes(p.kind));
let done=0;
const queue=[...targets];
await Promise.all(Array.from({length:8},async()=>{while(queue.length){
  const page=queue.shift(),item=addItem(page),old=oldItems.get(item.id);
  if(!args.includes('--refresh')&&old&&old.catalogBasis===item.basis&&old.indexComplete){items[items.indexOf(item)]=old;images.push(...previous.images.filter(x=>x.owner===old.id));done++;continue;}
  item.catalogBasis=item.basis;
  if(page.kind==='blog'){const result=await blog(item);item.indexComplete=result.body;}
  else if(page.kind==='ranking'){
    const base='app/ranking/'+item.key;
    await manifest(item,base+'/ogp/generation.json',[{key:base+'/ogp/ogp.png',usage:'ogp',templateId:'ogp'}],'ranking-ogp');
    await manifest(item,base+'/thumbnail.json',['light','dark'].map(v=>({key:base+'/thumbnail-'+v+'.webp',usage:'card',templateId:'link-card'})),'ranking-card');item.indexComplete=true;
  }else if(page.kind==='area'){
    const base='app/areas/'+item.key;await manifest(item,base+'/ogp/generation.json',[{key:base+'/ogp/ogp.png',usage:'ogp',templateId:'pref-silhouette'}],'areas-ogp');item.indexComplete=true;
  }else if(page.kind==='product'){
    const base='app/products/'+item.key;await manifest(item,base+'/ogp/generation.json',[{key:base+'/ogp/ogp.png',usage:'ogp',templateId:'ogp'}],'product-ogp');item.indexComplete=true;
  }else{
    const base=page.kind==='category'?'app/default/stats47':'app/themes/'+item.key;
    await manifest(item,base+'/ogp/generation.json',[{key:base+'/ogp/ogp.png',usage:'ogp',templateId:'ogp'}],page.kind+'-ogp');item.indexComplete=true;
  }
  done++;if(done%100===0)console.log(JSON.stringify({pages:done,total:targets.length,images:images.length}));
}}));
// All 47 outlines and all variants use the existing gallery catalog, not a second ratio list.
// Inline SVGs are image uses too. Preserve their exact byte range against the hashed article.
const inlineQueue=items.filter(i=>i.category==='blog'&&i.bodyRef&&!i.inlineIndexed);
await Promise.all(Array.from({length:8},async()=>{while(inlineQueue.length){
  const item=inlineQueue.shift();
  try{
    const bytes=await get(item.bodyRef.key);
    if(sha(bytes)!==item.bodyRef.sha256)throw Error('Article changed');
    const body=bytes.toString();
    for(const ref of inlineSvgReferences(body)){
      const svg=body.slice(ref.start,ref.end);
      addImage(item,item.bodyRef.key+'#svg-'+ref.start,{provider:'inline-svg',source:item.bodyRef,...ref},{collection:'blog-body',usage:'body',format:'svg',templateId:SVG_TEMPLATE[classify('inline.svg',svg)],inventoryStatus:'verified',...inspectSvg(svg),inputFiles:[refFile('article.md',item.bodyRef,'article')],occurrences:[{line:ref.line,heading:'',alt:'本文埋込SVG'}],missingReason:'元のSVGは本文から復元できます。生成用の数値入力との対応は未照合です。'});
    }
    item.inlineIndexed=true;
  }catch{item.inventoryError='本文の埋込画像を照合できません。再棚卸しが必要です。';}
}}));
for(const page of pages.filter(p=>p.kind==='area'&&p.published)){
  const key=page.key.slice(0,2),item=addItem({...page,id:'silhouette:'+key,key,kind:'material'});
  await manifest(item,'sns/pref-silhouette/'+key+'/generation.json',PREF_SILHOUETTE_VARIANTS.map(v=>({key:'sns/pref-silhouette/'+key+'/card-'+v+'.png',usage:'material',templateId:'pref-silhouette'})),'pref-silhouette');
}
// Static originals and production backgrounds remain local until explicitly archived; never claim R2 storage for them.
for(const directory of MATERIAL_ROOTS){
  const scan=dir=>{if(!fs.existsSync(dir))return;for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const file=path.join(dir,entry.name);if(entry.isDirectory()){scan(file);continue;}if(!/\.(svg|png|jpe?g|webp|gif)$/i.test(entry.name))continue;
    const rel=path.relative(ROOT,file).split(path.sep).join('/'),bytes=fs.readFileSync(file),item=addItem({id:'material:'+sha(rel).slice(0,24),key:rel,title:entry.name,kind:'material',href:'/',published:false});
    item.url=null;
    const row=addImage(item,rel,{provider:'git',path:rel,...(rel.startsWith('apps/web/public/')?{url:SITE+'/'+rel.slice('apps/web/public/'.length)}:{}),sha256:sha(bytes),bytes:bytes.length},{usage:'material',templateId:'background',collection:'static-material',inventoryStatus:'verified',format:path.extname(file).slice(1),sourceLinks:[{label:rel,relationship:'登録素材。使用箇所の全件照合は未実施。'}]});
    if(/\.svg$/i.test(file)){
      row.templateId=rel.startsWith('packages/gis/')?'pref-silhouette':SVG_TEMPLATE[classify(entry.name,bytes.toString())];
      for(const suffix of ['.json','.source.json']){
        const inputPath=file.replace(/(?:-ig)?\.svg$/i,suffix);
        if(!fs.existsSync(inputPath))continue;
        const data=fs.readFileSync(inputPath);
        row.inputFiles.push({name:path.basename(inputPath),provider:'git',path:path.relative(ROOT,inputPath).split(path.sep).join('/'),sha256:sha(data),bytes:data.length,role:suffix==='.json'?'data':'provenance',state:'observed-current'});
      }
    }
  }};scan(path.join(ROOT,directory));
}
for(const row of images)if(row.collection==='blog-ogp'&&row.usage==='card')row.collection='blog-card';
for(const tab of [...OGP_TABS.filter(x=>x!=='note-cover'),'product-ogp','blog-body','static-material']){
  const rows=images.filter(x=>x.collection===tab);
  coverage.push({collection:tab,images:rows.length,verified:rows.filter(x=>x.original?.sha256).length,missing:rows.filter(x=>x.inventoryStatus==='missing').length,unverified:rows.filter(x=>!x.original?.sha256).length});
}
const result={schemaVersion:1,updatedAt:new Date().toISOString(),items:items.sort((a,b)=>a.id.localeCompare(b.id)),images:images.sort((a,b)=>(a.owner+a.file).localeCompare(b.owner+b.file)),coverage};
if(args.includes('--apply'))writeWebInventory(ROOT,result);
console.log(JSON.stringify({pages:items.length,images:images.length,coverage,applied:args.includes('--apply')}));
