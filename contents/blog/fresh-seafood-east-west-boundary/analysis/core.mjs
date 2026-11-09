import {SPECIES,CITY,PREF,LON,LAT} from "./common.mjs"; import {load} from "./load.mjs";
export const V=load();
export const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
export const corr=(a,b)=>{const ma=mean(a),mb=mean(b);let n=0,da=0,db=0;a.forEach((x,i)=>{n+=(x-ma)*(b[i]-mb);da+=(x-ma)**2;db+=(b[i]-mb)**2});return n/Math.sqrt(da*db)};
export const order=CITY.map((_,i)=>i).sort((a,b)=>LON[a]-LON[b]);
export const avg=(k,win)=>CITY.map((_,i)=>mean(win.map(y=>V[k][y][i])));
export function logIdx(win,level=true){const o={};for(const [k] of SPECIES){const a=avg(k,win);const m=mean(a);o[k]=a.map(v=>Math.log(v/m));}
 if(level){for(let i=0;i<CITY.length;i++){const lv=mean(SPECIES.map(([k])=>o[k][i]));for(const [k] of SPECIES)o[k][i]-=lv;}}
 return o;}
export function bestSplit(x,lo=8,hi=39){const tot=x.reduce((s,v)=>s+(v-mean(x))**2,0);let best=null;for(let c=lo;c<=hi;c++){const W=order.slice(0,c).map(i=>x[i]),E=order.slice(c).map(i=>x[i]);const ssb=W.length*(mean(W)-mean(x))**2+E.length*(mean(E)-mean(x))**2;const r2=ssb/tot;if(!best||r2>best.r2)best={c,r2,w:mean(W),e:mean(E)};}return best;}
let seed=7; export const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
export function jacobi(A){const n=A.length;let Vv=Array.from({length:n},(_,i)=>Array.from({length:n},(_,j)=>i===j?1:0));A=A.map(r=>r.slice());
 for(let sweep=0;sweep<100;sweep++){let off=0;for(let i=0;i<n;i++)for(let j=i+1;j<n;j++)off+=A[i][j]**2;if(off<1e-14)break;
  for(let p=0;p<n;p++)for(let q=p+1;q<n;q++){if(Math.abs(A[p][q])<1e-15)continue;const th=(A[q][q]-A[p][p])/(2*A[p][q]);const t=Math.sign(th||1)/(Math.abs(th)+Math.sqrt(th*th+1));const c=1/Math.sqrt(t*t+1),s=t*c;
   for(let k=0;k<n;k++){const akp=A[k][p],akq=A[k][q];A[k][p]=c*akp-s*akq;A[k][q]=s*akp+c*akq;}
   for(let k=0;k<n;k++){const apk=A[p][k],aqk=A[q][k];A[p][k]=c*apk-s*aqk;A[q][k]=s*apk+c*aqk;}
   for(let k=0;k<n;k++){const vkp=Vv[k][p],vkq=Vv[k][q];Vv[k][p]=c*vkp-s*vkq;Vv[k][q]=s*vkp+c*vkq;}}}
 return {vals:A.map((r,i)=>r[i]),vecs:Vv};}
export function pca(win){const L=logIdx(win);const M=CITY.map((_,i)=>SPECIES.map(([k])=>L[k][i]));const mu=SPECIES.map((_,j)=>mean(M.map(r=>r[j])));const X=M.map(r=>r.map((v,j)=>v-mu[j]));const p=SPECIES.length;
 const C=Array.from({length:p},(_,a)=>Array.from({length:p},(_,b)=>X.reduce((s,r)=>s+r[a]*r[b],0)/46));const {vals,vecs}=jacobi(C);const idx=vals.map((_,i)=>i).sort((a,b)=>vals[b]-vals[a]);const tv=vals.reduce((s,v)=>s+v,0);
 return idx.slice(0,4).map(e=>{let vec=vecs.map(r=>r[e]);let score=X.map(r=>r.reduce((s,v,j)=>s+v*vec[j],0));if(corr(score,LON)<0){vec=vec.map(v=>-v);score=score.map(v=>-v);}return {varPct:vals[e]/tv*100,vec,score,corrLon:corr(score,LON),corrLat:corr(score,LAT)};});}
