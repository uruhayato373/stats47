import fs from "node:fs"; import path from "node:path"; import crypto from "node:crypto";
const ROOT="/Users/minamidaisuke/stats47";
function appId(){ if(process.env.NEXT_PUBLIC_ESTAT_APP_ID) return process.env.NEXT_PUBLIC_ESTAT_APP_ID;
 const env=fs.readFileSync(path.join(ROOT,"apps/web/.env.development"),"utf8"); const m=env.match(/NEXT_PUBLIC_ESTAT_APP_ID=\s*"?([^"\n]+)"?/); if(!m) throw new Error("no id"); return m[1].trim(); }
const CACHE=path.join(path.dirname(new URL(import.meta.url).pathname),"cache"); fs.mkdirSync(CACHE,{recursive:true});
export async function est(endpoint, params){
  const key=crypto.createHash("md5").update(endpoint+JSON.stringify(params)).digest("hex");
  const f=path.join(CACHE,key+".json"); if(fs.existsSync(f)) return JSON.parse(fs.readFileSync(f,"utf8"));
  const q=new URLSearchParams({appId:appId(),...params});
  const res=await fetch(`https://api.e-stat.go.jp/rest/3.0/app/json/${endpoint}?${q}`); if(!res.ok) throw new Error("HTTP "+res.status);
  const j=await res.json(); fs.writeFileSync(f,JSON.stringify(j)); return j; }
