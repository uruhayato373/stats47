import {est} from "../estat.mjs"; import fs from "node:fs";
let start=1, vals=[], meta;
while(true){ const j=await est("getStatsData",{statsDataId:"0002190004",cdCat02:"21",cdArea:"00000",limit:"100000",startPosition:String(start),metaGetFlg:"Y",cntGetFlg:"N"});
 const d=j.GET_STATS_DATA.STATISTICAL_DATA; meta??=d.CLASS_INF; vals.push(...[].concat(d.DATA_INF.VALUE)); const nx=d.RESULT_INF.NEXT_KEY; if(!nx)break; start=Number(nx);}
console.log(vals.length); fs.writeFileSync("k07/age.json",JSON.stringify({meta,vals}));
const names={}; for(const c of [].concat([].concat(meta.CLASS_OBJ).find(o=>o["@id"]==="cat01").CLASS)) names[c["@code"]]=c["@name"];
const g=(c,a,s,t="2025000000")=>vals.find(v=>v["@cat01"]===c&&v["@cat03"]===a&&v["@cat04"]===s&&v["@time"]===t)?.["$"];
for(const [c,lab] of [["002","集計世帯数"],["009","世帯主の年齢"],["011","持家率"],["015","家賃を支払う世帯割合"],["059","消費支出"],["060","食料"],["098","外食"],["102","住居"],["103","家賃地代"]])
 console.log(lab, ["A00","435","615","560","565"].map(a=>a+":"+["0","1","2"].map(s=>g(c,a,s)).join("/")).join("  "));
