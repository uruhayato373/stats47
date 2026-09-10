import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
const script=fileURLToPath(new URL('../build-theme-alert.mjs',import.meta.url));
function run(t,{quality,live,liveCode='0',qualityCode='0'}={}){
 const cwd=fs.mkdtempSync(path.join(os.tmpdir(),'theme-alert-'));t.after(()=>fs.rmSync(cwd,{recursive:true,force:true}));
 for(const [file,value] of [['.claude/state/themes/quality.json',quality],['.claude/state/theme-charts/live-audit.json',live]]){if(value){const filename=path.join(cwd,file);fs.mkdirSync(path.dirname(filename),{recursive:true});fs.writeFileSync(filename,JSON.stringify(value));}}
 const output=path.join(cwd,'alert.md');const result=spawnSync(process.execPath,[script,'--output',output,'--live-code',liveCode,'--quality-code',qualityCode],{cwd,encoding:'utf8'});
 assert.equal(result.status,0,result.stderr);return {stdout:result.stdout,body:fs.readFileSync(output,'utf8')};
}
test('実行が timeout した場合は旧正常 snapshot でも recovery にしない',t=>{
 const result=run(t,{quality:{findings:[],summary:{added:[]}},live:{results:[]},qualityCode:'124'});
 assert.match(result.stdout,/alert_open=true/);assert.match(result.body,/監査実行または判定ゲートが失敗/);
});
test('snapshot が未生成でも実行失敗を通知する',t=>{
 assert.match(run(t,{liveCode:'1',qualityCode:'124'}).stdout,/alert_open=true/);
});
test('実行成功で異常が解消した場合だけ recovery に進める',t=>{
 assert.match(run(t,{quality:{findings:[],summary:{added:[]}},live:{results:[]}}).stdout,/alert_open=false/);
});
test('既知の coverage 警告は毎週の異常通知にしない',t=>{
 const result=run(t,{quality:{findings:[{code:'partial-coverage',severity:'warn',metricKey:'test'}],summary:{added:[]}},live:{results:[]}});
 assert.match(result.stdout,/alert_open=false/);assert.match(result.stdout,/new_warnings=0/);
});
