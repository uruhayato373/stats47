import fs from "node:fs";
const meta=JSON.parse(fs.readFileSync(new URL("./size.meta.json",import.meta.url)));
export const names={}; for(const c of [].concat([].concat(meta.CLASS_OBJ).find(o=>o["@id"]==="cat01").CLASS)) names[c["@code"]]=c["@name"];
const vals=JSON.parse(fs.readFileSync(new URL("./size.json",import.meta.url)));
const tb={}; for(const v of vals) tb[`${v["@cat01"]}|${v["@cat02"]}|${v["@cat03"]}`]=v["$"];
const num=x=>x==null||!/^-?[0-9.]+$/.test(x)?null:Number(x);
export const SZ=(c,sz,w="03")=>num(tb[`${c}|${w}|${sz}`]);
