import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import assert from 'node:assert/strict';
import test from 'node:test';
import { readLinkCardLedger, writeLinkCardLedger } from '../lib/link-card-ledger.mjs';

test('flat ledgers migrate without losing any publication evidence',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'link-card-ledger-'));const file=path.join(dir,'link-card-rollout.json');
 try{
  const ledger={schemaVersion:1,policyVersion:'v1',siteMetadataVerification:{passed:12,failed:0},entries:[{id:'magazine:m',publication:{sha:'original'}},...Array.from({length:1234},(_,i)=>({id:`site:/ranking/${i}`,sitePublication:{sha256:'a'.repeat(64),fingerprint:'b'.repeat(64),url:`https://example.test/${i}`}}))]};
  fs.writeFileSync(file,JSON.stringify(ledger));assert.deepEqual(readLinkCardLedger(file),ledger);
  writeLinkCardLedger(file,ledger);const root=JSON.parse(fs.readFileSync(file,'utf8'));
  assert.equal(root.entries.length,1);assert.equal(root.siteShards.length,3);
  const restored=readLinkCardLedger(file);assert.deepEqual(restored.entries,ledger.entries);assert.deepEqual(restored.siteMetadataVerification,ledger.siteMetadataVerification);
  for(const name of root.siteShards){const bytes=fs.readFileSync(path.join(dir,name));assert.ok(bytes.length<1024*1024);assert.ok(JSON.parse(bytes).entries.length<=500);}
  restored.entries[501].sitePublication.sha256='c'.repeat(64);writeLinkCardLedger(file,restored);assert.equal(readLinkCardLedger(file).entries[501].sitePublication.sha256,'c'.repeat(64));
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('shard paths cannot escape the ledger folder or duplicate targets',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'link-card-ledger-'));const file=path.join(dir,'link-card-rollout.json');
 try{fs.writeFileSync(file,JSON.stringify({schemaVersion:1,entries:[],siteShards:['../other.json']}));assert.throws(()=>readLinkCardLedger(file),/shard path/);
 assert.throws(()=>writeLinkCardLedger(file,{schemaVersion:1,entries:[{id:'same'},{id:'same'}]}),/duplicate/);
 }finally{fs.rmSync(dir,{recursive:true,force:true});}
});
test('oversized records fail before replacing the manifest',()=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'link-card-ledger-'));const file=path.join(dir,'link-card-rollout.json');
 try{fs.writeFileSync(file,'unchanged');assert.throws(()=>writeLinkCardLedger(file,{schemaVersion:1,entries:[{id:'site:/large',payload:'a'.repeat(1024*1024)}]}),/1 MiB/);assert.equal(fs.readFileSync(file,'utf8'),'unchanged');}
 finally{fs.rmSync(dir,{recursive:true,force:true});}
});

test('temporary Windows file sharing errors retry without losing publication evidence',(t)=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'link-card-ledger-'));const file=path.join(dir,'link-card-rollout.json');
 const rename=fs.renameSync;let calls=0;
 const mock=t.mock.method(fs,'renameSync',(...args)=>{if(++calls===1)throw Object.assign(Error('reader holds file'),{code:'EPERM'});return rename(...args);});
 try{const ledger={schemaVersion:1,entries:[{id:'magazine:m',status:'published'}]};writeLinkCardLedger(file,ledger);assert.equal(calls,2);assert.equal(readLinkCardLedger(file).entries[0].status,'published');}
 finally{mock.mock.restore();fs.rmSync(dir,{recursive:true,force:true});}
});

test('permanent replacement failure preserves the previous ledger and remains an error',(t)=>{
 const dir=fs.mkdtempSync(path.join(os.tmpdir(),'link-card-ledger-'));const file=path.join(dir,'link-card-rollout.json');
 fs.writeFileSync(file,'previous');let calls=0;
 const mock=t.mock.method(fs,'renameSync',()=>{calls++;throw Object.assign(Error('locked'),{code:'EACCES'});});
 try{assert.throws(()=>writeLinkCardLedger(file,{schemaVersion:1,entries:[]}),/locked/);assert.equal(calls,5);assert.equal(fs.readFileSync(file,'utf8'),'previous');}
 finally{mock.mock.restore();fs.rmSync(dir,{recursive:true,force:true});}
});
