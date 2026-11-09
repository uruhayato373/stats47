import {est} from "../estat.mjs"; import fs from "node:fs";
async function getAll(id, params){ let start=1, vals=[]; while(true){ const j=await est("getStatsData",{statsDataId:id,limit:"100000",startPosition:String(start),metaGetFlg:"N",cntGetFlg:"N",...params}); const d=j.GET_STATS_DATA.STATISTICAL_DATA; vals.push(...[].concat(d.DATA_INF?.VALUE||[])); const nx=d.RESULT_INF.NEXT_KEY; if(!nx)break; start=Number(nx);} return vals; }
const a=await getAll("0004023614",{cdArea:"00000",cdCat02:"22"}), b=await getAll("0004023605",{cdArea:"00000",cdCat02:"04"});
fs.writeFileSync("k07/singleW.json",JSON.stringify(a)); fs.writeFileSync("k07/twoW.json",JSON.stringify(b)); console.log(a.length,b.length);
