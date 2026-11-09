import fs from "node:fs";
const L=n=>JSON.parse(fs.readFileSync(new URL(`./${n}.json`,import.meta.url)));
export const info=L("info");
const tbl={}; for (const n of ["single","two","all"]) { tbl[n]={}; for(const v of L(n).vals){ tbl[n][v["@cat01"]+"|"+v["@cat02"]+"|"+v["@time"]]=v["$"]; } }
const num=x=>x==null||!/^-?[0-9.]+$/.test(x)?null:Number(x);
export const S=(c,y)=>num(tbl.single[`${c}|21|${y}000000`]);
export const T=(c,y)=>num(tbl.two[`${c}|03|${y}000000`]);
export const A=(c,y)=>num(tbl.all[`${c}|11|${y}000000`]);
export const HH=y=>T("000300000",y);
