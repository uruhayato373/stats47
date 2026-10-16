#!/usr/bin/env node
/** Restore exact preserved inputs under the OS scratch directory. Never replace source data with latest values. */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import { ROOT,imageById,readTemplates,safeName,sha } from './lib/workspace.mjs';
import { readMediaObject } from './lib/storage.mjs';
const args=process.argv.slice(2);
if(args.length!==2||args[0]!=='--id')throw Error('Usage: npm run media:prepare -- --id IMG-...');
const image=imageById(ROOT,args[1]);
if(image.kind==='cover')throw Error('Use the dedicated cover production workflow.');
const work=fs.mkdtempSync(path.join(os.tmpdir(),'stats47-media-'));
const restored=[];
try{
  if(image.original){
    const bytes=await readMediaObject(ROOT,image.original),file='original'+(image.original.provider==='inline-svg'?'.svg':path.extname(image.original.key??image.original.path??new URL(image.original.url).pathname));
    fs.writeFileSync(path.join(work,file),bytes);restored.push({file,sha256:sha(bytes),bytes:bytes.length});
  }
  for(const input of image.inputFiles){
    if(!safeName(input.name))throw Error('Invalid input ownership');
    const bytes=await readMediaObject(ROOT,input);
    const file=path.join('inputs',input.name),target=path.join(work,file);
    fs.mkdirSync(path.dirname(target),{recursive:true});fs.writeFileSync(target,bytes);
    if(sha(fs.readFileSync(target))!==input.sha256)throw Error('Local readback mismatch');
    restored.push({file,sha256:input.sha256,bytes:bytes.length});
  }
  const request={schemaVersion:1,imageId:image.id,owner:image.owner,basis:image.basis,policy:image.policy,classification:image.classification,tasks:image.tasks,
    template:readTemplates(ROOT).templates.find(t=>t.id===image.templateId),generation:image.generation,sourceLinks:image.sourceLinks,restored,
    reproducibility:image.inputFiles.some(f=>f.role==='data'||(f.role==='input'&&/\.(json|csv)$/.test(f.name)))?'fixed-inputs-restored-render-unverified':'numeric-inputs-unverified',
    instruction:'Use these exact input values, year and units. Render through the referenced deterministic renderer. Upload candidate and evidence in /ops/image-library. A restore is not a successful re-render.'};
  fs.writeFileSync(path.join(work,'request.json'),JSON.stringify(request,null,2)+'\n');
  console.log(JSON.stringify({directory:work,...request}));
}catch(error){
  fs.writeFileSync(path.join(work,'FAILED.txt'),'Restore incomplete. Do not render or approve from this directory.\n');
  throw error;
}
