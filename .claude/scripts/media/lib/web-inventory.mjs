import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { datasetPath,datasetDir } from '../../../../config/datasets.mjs';
import { R2_BUCKET, R2_PUBLIC_BASE_URL, SITE_ORIGIN } from '../../lib/site-config.cjs';

export const WEB_INVENTORY = datasetPath('content.web-image-inventory');
export const WEB_PARTS=datasetDir('content.web-image-parts');
export const MATERIAL_ROOTS=['assets','apps/web/public','apps/remotion/public','config/coconala/assets','contents/blog','packages/gis/data'];
export const digest = bytes=>createHash('sha256').update(bytes).digest('hex');
let indexCache;
export function readWebInventory(root) {
  const file=path.join(root,WEB_INVENTORY);
  if(!fs.existsSync(file))return {schemaVersion:1,updatedAt:null,items:[],images:[],coverage:[]};
  const stat=fs.statSync(file),stamp=root+':'+stat.mtimeMs+':'+stat.size;
  if(indexCache?.stamp===stamp)return indexCache.value;
  const index=JSON.parse(fs.readFileSync(file,'utf8'));
  if(index.schemaVersion!==2)return index;
  const value={...index,items:[],images:[]};
  for(const part of index.parts){
    if(!/^[a-f0-9]{2}\.json$/.test(part.file))throw Error('Invalid image inventory part');
    const bytes=fs.readFileSync(path.join(root,WEB_PARTS,part.file));
    if(digest(bytes)!==part.sha256||bytes.length!==part.bytes)throw Error('Image inventory update is incomplete. Retry after the index is saved.');
    const data=JSON.parse(bytes);
    value.items.push(...data.items);value.images.push(...data.images);
  }
  value.items.sort((a,b)=>a.id.localeCompare(b.id));
  value.images.sort((a,b)=>(a.owner+a.file).localeCompare(b.owner+b.file));
  indexCache={stamp,value};return value;
}
export function writeWebInventory(root,result){
  const file=path.join(root,WEB_INVENTORY),lock=file+'.lock',fd=fs.openSync(lock,'wx'),directory=path.join(root,WEB_PARTS);
  try{
    fs.mkdirSync(directory,{recursive:true});
    const groups=new Map(),group=id=>{const key=digest(id).slice(0,2);if(!groups.has(key))groups.set(key,{items:[],images:[]});return groups.get(key);};
    for(const item of result.items)group(item.id).items.push(item);
    for(const image of result.images)group(image.owner).images.push(image);
    const parts=[];
    for(const [key,data]of [...groups].sort()){
      const bytes=Buffer.from(JSON.stringify(data,null,2)+'\n'),name=key+'.json';
      if(bytes.length>1024*1024)throw Error('Image inventory part exceeds repository limit');
      const target=path.join(directory,name),temp=target+'.'+process.pid+'.tmp';
      fs.writeFileSync(temp,bytes);fs.renameSync(temp,target);
      parts.push({file:name,sha256:digest(bytes),bytes:bytes.length});
    }
    const index={schemaVersion:2,updatedAt:result.updatedAt,counts:{items:result.items.length,images:result.images.length},parts,coverage:result.coverage};
    const temp=file+'.'+process.pid+'.tmp';
    fs.writeFileSync(temp,JSON.stringify(index,null,2)+'\n');fs.renameSync(temp,file);indexCache=undefined;
  }finally{fs.closeSync(fd);fs.unlinkSync(lock);}
}
export const publicRef = (key,bytes) => ({provider:'r2-public',bucket:R2_BUCKET,key,url:R2_PUBLIC_BASE_URL+'/'+key,...(bytes?{sha256:digest(bytes),bytes:bytes.length}:{})});
export function publicUrlAllowed(url) {
  try { const u=new URL(url);return !u.username&&!u.password&&[new URL(R2_PUBLIC_BASE_URL).origin,new URL(SITE_ORIGIN).origin].includes(u.origin); } catch {return false;}
}
export function imageReferences(markdown, base) {
  const refs=[];
  // Preserve occurrence, alt text and the nearest heading: these are actual uses, not a guessed filename mapping.
  const pattern=/!\[([^\]]*)\]\(<?([^\s)>]+)>?(?:\s+[^)]*)?\)|<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  for(const m of markdown.matchAll(pattern)) {
    let url;try{url=new URL(m[2]??m[3],base).href;}catch{continue;}
    if(!/^https?:/i.test(url))continue;
    const prior=markdown.slice(0,m.index),headings=[...prior.matchAll(/^#{1,6}\s+(.+)$/gm)];
    refs.push({url,alt:m[1]??'',heading:headings.at(-1)?.[1]??'',line:prior.split('\n').length});
  }
  return refs;
}
export function inlineSvgReferences(markdown){
  return [...markdown.matchAll(/<svg\b[\s\S]*?<\/svg\s*>/gi)].map(m=>({start:m.index,end:m.index+m[0].length,sha256:digest(Buffer.from(m[0])),bytes:Buffer.byteLength(m[0]),line:markdown.slice(0,m.index).split('\n').length}));
}
export function sourceReferences(value) {
  const refs=new Set();
  const walk=v=>{if(typeof v==='string'&&/^(?:r2:)?app\/[a-z0-9/_-]+\.(json|csv)$/i.test(v))refs.add(v.replace(/^r2:/,''));else if(Array.isArray(v))v.forEach(walk);else if(v&&typeof v==='object')Object.values(v).forEach(walk);};
  walk(value);return [...refs];
}
