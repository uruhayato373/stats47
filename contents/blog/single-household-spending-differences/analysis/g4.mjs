import {est} from "../estat.mjs"; import fs from "node:fs";
const j=await est("getMetaInfo",{statsDataId:"0002070009"}); const m=j.GET_META_INFO.METADATA_INF; console.log(JSON.stringify(m.TABLE_INF.TITLE));
for(const o of [].concat(m.CLASS_INF.CLASS_OBJ)){const cs=[].concat(o.CLASS);console.log(o["@id"],o["@name"],cs.length, o["@id"]==="cat01"?"":cs.slice(0,12).map(c=>c["@code"]+":"+c["@name"]).join(" | "));}
let start=1, vals=[]; while(true){ const r=await est("getStatsData",{statsDataId:"0002070009",cdArea:"00000",cdTime:"2025000000",limit:"100000",startPosition:String(start),metaGetFlg:"Y",cntGetFlg:"N"}); const d=r.GET_STATS_DATA.STATISTICAL_DATA; vals.push(...[].concat(d.DATA_INF.VALUE)); fs.writeFileSync("k07/size.meta.json",JSON.stringify(d.CLASS_INF)); const nx=d.RESULT_INF.NEXT_KEY; if(!nx)break; start=Number(nx);}
fs.writeFileSync("k07/size.json",JSON.stringify(vals)); console.log(vals.length);
