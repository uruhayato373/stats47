#!/usr/bin/env node
/** Restore exact preserved inputs under the OS scratch directory. Never replace source data with latest values. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ROOT,imageById,readSources,readTemplates,safeName,sha } from './lib/workspace.mjs';
import { readVerified } from './lib/storage.mjs';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--id')throw Error('Usage: npm run media:prepare -- --id IMG-...');
const image=imageById(ROOT,args[1]);
if(image.kind==='cover')throw Error('Use the dedicated cover production workflow.');
const article=readSources(ROOT).articles.find(a=>image.owner==='note/'+a.key);
const work=fs.mkdtempSync(path.join(os.tmpdir(),'stats47-media-'));
const restored=[];
try{
  if(image.original?.key){
    const bytes=await readVerified(image.original),file='original'+path.extname(image.original.key);
    fs.writeFileSync(path.join(work,file),bytes);restored.push({file,sha256:sha(bytes),bytes:bytes.length});
  }
  for(const input of image.inputFiles){
    if(!article||!safeName(input.name))throw Error('Invalid input ownership');
    const bytes=await readVerified({...input,bucket:image.original.bucket,key:article.r2Path+'/'+input.name});
    const file=path.join('inputs',input.name),target=path.join(work,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    if(sha(fs.readFileSync(target))!==input.sha256)throw Error('Local readback mismatch');
    restored.push({file,sha256:input.sha256,bytes:bytes.length});
  }
  const request={schemaVersion:1,imageId:image.id,owner:image.owner,basis:image.basis,policy:image.policy,
    template:readTemplates(ROOT).templates.find(t=>t.id===image.templateId),restored,
    reproducibility:image.inputFiles.some(f=>/\.(json|csv)$/.test(f.name))?'fixed-inputs-restored-render-unverified':'numeric-inputs-unverified',
    instruction:'Use these exact input values, year and units. Render through the referenced deterministic renderer. Upload candidate and evidence in /ops/image-library. A restore is not a successful re-render.'};
  fs.writeFileSync(path.join(work,'request.json'),JSON.stringify(request,null,2)+'\n');
  console.log(JSON.stringify({directory:work,...request}));
}catch(error){
  fs.writeFileSync(path.join(work,'FAILED.txt'),'Restore incomplete. Do not render or approve from this directory.\n');
  throw error;
}
