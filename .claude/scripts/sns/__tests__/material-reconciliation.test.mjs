import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findMaterialPost, prepareMaterial, materialDirectory } from '../lib/material-reconciliation.mjs';
const material={platform:'x',domain:'area',content_key:'01000',batch:'2026-10-11'};
test('既存IDの別名・同一媒体の正確なファイルを照合し、別媒体は別候補',()=>{
 assert.equal(findMaterialPost([{id:1,platform:'x',domain:'area',content_key:'area-01000-profile'}],material)?.id,1);
 const posts=[{id:2,platform:'x',media_path:'sns/area/01000/x/a.png'}];
 assert.equal(findMaterialPost(posts,material,['.local/r2/sns/area/01000/x/a.png'])?.id,2);
 assert.equal(findMaterialPost(posts,{...material,platform:'instagram'},['.local/r2/sns/area/01000/x/a.png']),null);
 assert.equal(findMaterialPost([{...posts[0],media_path:'https://other.example/sns/area/01000/x/a.png'}],material,['.local/r2/sns/area/01000/x/a.png']),null);
});
test('削除済みも素材を所有し、再実行で重複IDを作らない',()=>{
 const posts=[{id:3,platform:'x',status:'deleted',material_keys:['x/area/01000']}];
 assert.equal(findMaterialPost(posts,material)?.id,3);
 assert.equal(findMaterialPost(posts,material)?.status,'deleted');
});
test('曖昧な一致を1件に決めつけない',()=>{
 assert.throws(()=>findMaterialPost([1,2].map(id=>({id,...material})),material),/複数ID/);
});
test('プレビューとhookだけの素材は投稿画像・完成本文として登録しない',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'sns-import-'));
 try {
  const dir=path.join(root,'.local/r2/sns/area/01000/x');fs.mkdirSync(dir,{recursive:true});
  fs.writeFileSync(path.join(dir,'candidate-preview.png'),'test');
  fs.writeFileSync(path.join(dir,'caption.json'),JSON.stringify({hookText:'本文ではない',displayTitle:'北海道'}));
  const p=prepareMaterial(root,material);
  assert.equal(p.record.status,'draft');assert.equal(p.record.approval.state,'pending');
  assert.equal(p.record.media_path,null);assert.equal(p.record.caption,'');
  assert.equal(p.record.scheduled_at,null);assert.equal(p.record.planning.title,'北海道');
  assert.equal(p.record.planning.preview_only,true);
  assert.throws(()=>materialDirectory(root,{...material,content_key:'../escape'}),/不正/);
 } finally {fs.rmSync(root,{recursive:true,force:true});}
});
