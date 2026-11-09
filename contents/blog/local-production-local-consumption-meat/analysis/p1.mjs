import {est} from "../estat.mjs"; import fs from "node:fs";
const j=await est("getStatsData",{statsDataId:"0002006790",limit:"100000",metaGetFlg:"Y",cntGetFlg:"N"});
const d=j.GET_STATS_DATA.STATISTICAL_DATA; const vals=[].concat(d.DATA_INF.VALUE); console.log(vals.length, Object.keys(vals[0]));
const c1=[].concat([].concat(d.CLASS_INF.CLASS_OBJ).find(o=>o["@id"]==="cat01").CLASS); const c2=[].concat([].concat(d.CLASS_INF.CLASS_OBJ).find(o=>o["@id"]==="cat02").CLASS);
const tabs=[].concat(d.CLASS_INF.CLASS_OBJ).filter(o=>!["cat01","cat02"].includes(o["@id"])).map(o=>o["@id"]+":"+[].concat(o.CLASS).map(c=>c["@code"]+c["@name"]+(c["@unit"]||"")).join(","));
console.log(tabs);
fs.writeFileSync("k015/share2020.json",JSON.stringify({vals,c1,c2}));
const g=(p,i)=>vals.find(v=>v["@cat01"]===p&&v["@cat02"]===i)?.["$"];
for(const i of ["001","015","018","021"]) console.log(i,c2.find(c=>c["@code"]===i)["@name"],["001","013","046","045","048"].map(p=>p+"="+g(p,i)).join(" "));
