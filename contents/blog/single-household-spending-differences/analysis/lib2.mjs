import fs from "node:fs";
const age=JSON.parse(fs.readFileSync(new URL("./age.json",import.meta.url)));
const tb={}; for(const v of age.vals) tb[`${v["@cat01"]}|${v["@cat03"]}|${v["@cat04"]}|${v["@time"].slice(0,4)}`]=v["$"];
const num=x=>x==null||!/^-?[0-9.]+$/.test(x)?null:Number(x);
export const AG=(c,a,s,y)=>num(tb[`${c}|${a}|${s}|${y}`]);
export const names={}; for(const c of [].concat([].concat(age.meta.CLASS_OBJ).find(o=>o["@id"]==="cat01").CLASS)) names[c["@code"]]=c["@name"];
