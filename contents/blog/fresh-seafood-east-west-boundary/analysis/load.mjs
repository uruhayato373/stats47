import fs from "node:fs"; import {SPECIES} from "./common.mjs";
// values[species][year][i] i=0..46 by areaCode order
export function load(){
  const out={};
  for(const [k,n] of SPECIES){ const j=JSON.parse(fs.readFileSync(`/tmp/k22/${k}.json`)); const by={};
    for(const r of j.rows){ const y=r.yearCode; by[y]??=new Array(47).fill(null); by[y][Number(r.areaCode.slice(0,2))-1]=r.value; }
    out[k]=by; }
  return out; }
