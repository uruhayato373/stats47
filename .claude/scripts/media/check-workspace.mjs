#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ROOT,FILES,readQuality,readTemplates,sourceItems,imageLibrary,safeName } from './lib/workspace.mjs';
const quality=readQuality(ROOT),templates=readTemplates(ROOT),items=sourceItems(ROOT),images=imageLibrary(ROOT).images;
const owners=new Set(items.map(i=>i.id)),ids=new Set(images.map(i=>i.id)),types=new Set(templates.templates.map(t=>t.id));
for(const template of templates.templates)if(template.renderer&&(!safeName(template.renderer.replace(/\/$/,''))||!fs.existsSync(path.join(ROOT,template.renderer))))throw Error('Missing renderer: '+template.id);
for(const id of Object.keys(quality.reviews))if(!owners.has(id))throw Error('Orphan review: '+id);
for(const [id,record]of Object.entries(quality.images)){
  if(!ids.has(id))throw Error('Orphan image: '+id);
  if(!types.has(record.templateId))throw Error('Unknown template: '+id);
}
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,FILES.inventory),'utf8'));
for(const [key,entry]of Object.entries(inventory.articles)){
  if(!owners.has('note/'+key))throw Error('Orphan inventory: '+key);
  if(!['indexed','unverified','unavailable'].includes(entry.status)||!Array.isArray(entry.files))throw Error('Invalid inventory: '+key);
  if(entry.files.some(f=>!safeName(f.name)||!Number.isSafeInteger(f.bytes)||f.bytes<1||!/^[a-f0-9]{64}$/.test(f.sha256)))throw Error('Invalid file: '+key);
  if(new Set(entry.files.map(f=>f.name)).size!==entry.files.length)throw Error('Duplicate files: '+key);
}
console.log(JSON.stringify({status:'pass',items:items.length,images:images.length,reviews:Object.keys(quality.reviews).length,templates:templates.templates.length}));
