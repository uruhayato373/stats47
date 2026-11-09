import {est} from "../estat.mjs"; import fs from "node:fs";
const out={};
async function getAll(id, params){ // handle paging
  let start=1, vals=[], total=0, meta=null;
  while(true){ const j=await est("getStatsData",{statsDataId:id,limit:"100000",startPosition:String(start),metaGetFlg:"Y",cntGetFlg:"N",...params});
    const d=j.GET_STATS_DATA.STATISTICAL_DATA; if(!d){console.log(JSON.stringify(j.GET_STATS_DATA.RESULT));break;}
    meta??=d.CLASS_INF; vals.push(...[].concat(d.DATA_INF?.VALUE||[])); total=Number(d.RESULT_INF.TOTAL_NUMBER);
    const next=d.RESULT_INF.NEXT_KEY; if(!next) break; start=Number(next); }
  return {meta,vals,total}; }
for (const [name,id,p] of [["single","0004023614",{cdArea:"00000",cdCat02:"21"}],["two","0004023605",{cdArea:"00000",cdCat02:"03"}],["all","0004023612",{cdArea:"00000"}]]) {
  const r=await getAll(id,p); console.log(name,r.total,r.vals.length); fs.writeFileSync(`k07/${name}.json`,JSON.stringify(r)); }
