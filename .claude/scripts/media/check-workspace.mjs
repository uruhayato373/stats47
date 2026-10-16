#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import { ROOT,FILES,readQuality,readTemplates,sourceItems,imageLibrary,safeName } from './lib/workspace.mjs';
import { readWebInventory,publicUrlAllowed } from './lib/web-inventory.mjs';
import { auditClassification, IMAGE_ROLES } from './lib/classification.mjs';
import schema from '../../../data/content-operations/quality.schema.json' with {type:'json'};
const quality=readQuality(ROOT),templates=readTemplates(ROOT),items=sourceItems(ROOT),images=imageLibrary(ROOT).images;
const owners=new Set(items.map(i=>i.id)),ids=new Set(images.map(i=>i.id)),types=new Set(templates.templates.map(t=>t.id));
if(owners.size!==items.length||ids.size!==images.length)throw Error('Duplicate owner or image ID');
const web=readWebInventory(ROOT);
for(const row of web.images){
  if(!owners.has(row.owner)||!types.has(row.templateId))throw Error('Unresolved web image');
  for(const ref of [row.original,...row.inputFiles]){
    if(ref.key&&!safeName(ref.key))throw Error('Unsafe web key');
    if(ref.url&&ref.provider!=='external'&&!publicUrlAllowed(ref.url))throw Error('Unsafe web URL');
    if(ref.sha256&&(!/^[a-f0-9]{64}$/.test(ref.sha256)||!Number.isSafeInteger(ref.bytes)||ref.bytes<1))throw Error('Invalid image or input hash');
  }
}
for(const template of templates.templates)if(template.renderer&&(!safeName(template.renderer.replace(/\/$/,''))||!fs.existsSync(path.join(ROOT,template.renderer))))throw Error('Missing renderer: '+template.id);
for(const id of Object.keys(quality.reviews))if(!owners.has(id))throw Error('Orphan review: '+id);
for(const [id,record]of Object.entries(quality.images)){
  if(!ids.has(id))throw Error('Orphan image: '+id);
  if(!types.has(record.templateId))throw Error('Unknown template: '+id);
  for(const old of record.classificationHistory??[])if(!old.templateId||!types.has(old.templateId))throw Error('Unknown classification history: '+id);
}
const roles=Object.keys(IMAGE_ROLES).filter(r=>r!=='unresolved').sort();
if(JSON.stringify(roles)!==JSON.stringify([...schema.definitions.classification.properties.role.enum].sort()))throw Error('Classification schema/role drift');
const classification=auditClassification(images,templates.templates);
const gaps=imageLibrary(ROOT).inventoryGaps;
if(gaps.some(g=>!owners.has(g.owner)||!g.reason))throw Error('Unowned inventory gap');
const inventory=JSON.parse(fs.readFileSync(path.join(ROOT,FILES.inventory),'utf8'));
for(const [key,entry]of Object.entries(inventory.articles)){
  if(!owners.has('note/'+key))throw Error('Orphan inventory: '+key);
  if(!['indexed','unverified','unavailable'].includes(entry.status)||!Array.isArray(entry.files))throw Error('Invalid inventory: '+key);
  if(entry.files.some(f=>!safeName(f.name)||!Number.isSafeInteger(f.bytes)||f.bytes<1||!/^[a-f0-9]{64}$/.test(f.sha256)))throw Error('Invalid file: '+key);
  if(new Set(entry.files.map(f=>f.name)).size!==entry.files.length)throw Error('Duplicate files: '+key);
}
console.log(JSON.stringify({status:'pass',items:items.length,images:images.length,reviews:Object.keys(quality.reviews).length,templates:templates.templates.length,
  classification,inventoryPendingOwners:new Set(gaps.map(g=>g.owner)).size}));
