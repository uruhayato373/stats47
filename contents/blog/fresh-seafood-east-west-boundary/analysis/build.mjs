import fs from "node:fs"; import path from "node:path";
import {SPECIES,CITY,PREF,LON,LAT} from "./common.mjs"; import * as C from "./core.mjs";
const SLUG="fresh-seafood-east-west-boundary";
const OUT=`/Users/minamidaisuke/stats47/contents/blog/${SLUG}/data`; fs.mkdirSync(OUT,{recursive:true});
const w=(n,o)=>fs.writeFileSync(path.join(OUT,n),JSON.stringify(o,null,2)+"\n");
const r1=x=>Math.round(x*10)/10, r2=x=>Math.round(x*100)/100;
const SRC="家計調査（総務省）";
const dispSrc=[{label:"家計調査",surveyId:"kakei-chousa"}];
const KEY={tuna:"tuna",...Object.fromEntries(SPECIES.map(([k])=>[k,k]))};
const inputs=(yr)=>SPECIES.map(([k])=>({rankingKey:`${k}-consumption-expenditure`,year:yr}));
const WIN=[2021,2022,2023,2024,2025], WINS={"2009〜2013":[2009,2010,2011,2012,2013],"2015〜2019":[2015,2016,2017,2018,2019],"2021〜2025":WIN};
const names=Object.fromEntries(SPECIES);
const summary={window:"2021〜2025年の5年平均",species:SPECIES.map(([k,n])=>n),cityNote:"東京都は区部。県庁所在市の二人以上の世帯の1世帯あたり年間支出額。"};
// winners
const win={};
summary.winners=SPECIES.map(([k,n])=>{
  const ys=Object.keys(C.V[k]).sort(); const wins={};
  for(const y of ys){const a=C.V[k][y];const i=a.indexOf(Math.max(...a));wins[CITY[i]]=(wins[CITY[i]]||0)+1;}
  const a25=C.V[k]["2025"], i25=a25.indexOf(Math.max(...a25)); const sorted=a25.map((v,i)=>[v,i]).sort((x,y)=>y[1]-x[1]).sort((x,y)=>y[0]-x[0]);
  const av=C.avg(k,WIN), i5=av.indexOf(Math.max(...av)); const s5=av.map((v,i)=>[v,i]).sort((x,y)=>y[0]-x[0]);
  const o={species:n,key:k,winner2025:CITY[i25],value2025:a25[i25],second2025:CITY[sorted[1][1]],secondValue2025:sorted[1][0],winner5y:CITY[i5],value5y:Math.round(av[i5]),second5y:CITY[s5[1][1]],secondValue5y:Math.round(s5[1][0]),nationalMean5y:Math.round(C.mean(av)),winsOfWinner5y:wins[CITY[i5]]||0,winsOfWinner2025:wins[CITY[i25]]||0,years:ys.length,winCounts:Object.entries(wins).sort((x,y)=>y[1]-x[1]).slice(0,4)};
  win[k]=o; return o; });
// 1) first-place map (5y avg winners)
const cnt=new Array(47).fill(0); summary.winners.forEach(o=>{cnt[CITY.indexOf(o.winner5y)]++;});
w("fresh-fish-first-place-map.json",{title:"生鮮魚介18種で1位の数（県庁所在市）",subtitle:"2021〜2025年の平均",unit:"魚種",source:SRC,scheme:"Oranges",data:PREF.map((n,i)=>({areaName:n,value:cnt[i]}))});
w("fresh-fish-first-place-map.source.json",{kind:"calculated",inputs:inputs("2021-2025"),formula:"18魚種それぞれの2021〜2025年の年間支出額の平均が47市で最大の都市に1を数え、都市ごとに合計した魚種数",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
// 2) stability
const stab=summary.winners.map(o=>({label:`${o.species} ${o.winner5y}`,value:o.winsOfWinner5y}));
w("fresh-fish-winner-stability-ranking.json",{title:"1位都市が19年のうち1位だった年数",subtitle:"2007〜2025年・2021〜2025年平均の1位都市",unit:"年",source:SRC,data:stab});
w("fresh-fish-winner-stability-ranking.source.json",{kind:"calculated",inputs:inputs("2007-2025"),formula:"2021〜2025年の平均で1位の都市が、2007〜2025年の各年の単年の支出額でも1位だった年数（19年中）",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
// 3) PCA
const pc=C.pca(WIN); const PC1=pc[0], PC2=pc[1];
w("fresh-fish-east-west-score-map.json",{title:"生鮮魚介の買い方の東西スコア（県庁所在市）",subtitle:"2021〜2025年の平均",unit:"点",source:SRC,scheme:"PuOr",data:PREF.map((n,i)=>({areaName:n,value:r2(PC1.score[i])}))});
w("fresh-fish-east-west-score-map.source.json",{kind:"calculated",inputs:inputs("2021-2025"),formula:"18魚種の年間支出額（2021〜2025年平均）を魚種ごとに47市の平均で割って対数をとり、都市ごとに18魚種の平均を引いて（魚介全体の水準を除いて）、魚種ごとに中心化して主成分分析（共分散行列）をした第1主成分の得点。符号は県庁所在市の経度と正の相関になる向き（東が正）。経度は並べ替えと相関にだけ使う概数",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
const ns=PC2.score; // orient: positive = north (corr lat >0 already? ensure)
w("fresh-fish-north-south-score-map.json",{title:"かれい・しじみ軸のスコア（県庁所在市）",subtitle:"2021〜2025年の平均",unit:"点",source:SRC,scheme:"PuOr",data:PREF.map((n,i)=>({areaName:n,value:r2(PC2.score[i])}))});
w("fresh-fish-north-south-score-map.source.json",{kind:"calculated",inputs:inputs("2021-2025"),formula:"東西スコアと同じ（都市ごとの魚介全体の水準を除いた）主成分分析の第2主成分の得点。符号は県庁所在市の経度と正の相関になる向きにそろえた",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
// 4) split strength
const L=C.logIdx(WIN);
const split=SPECIES.map(([k,n])=>{const b=C.bestSplit(L[k]);return {species:n,key:k,r2:b.r2,west:CITY[C.order[b.c-1]],east:CITY[C.order[b.c]],eastOverWest:Math.exp(b.e-b.w),nWest:b.c};});
const splitWin={}; for(const [nm,ws] of Object.entries(WINS)){const Lw=C.logIdx(ws);splitWin[nm]=SPECIES.map(([k,n])=>{const b=C.bestSplit(Lw[k]);return {species:n,r2:r2(b.r2),boundary:`${CITY[C.order[b.c-1]]}|${CITY[C.order[b.c]]}`};});}
w("fresh-fish-split-strength-ranking.json",{title:"東西の二分で説明できる割合",subtitle:"2021〜2025年の平均・括弧内は境界",unit:"％",source:SRC,data:split.map(o=>({label:`${o.species}（${o.west}|${o.east}）`,value:Math.round(o.r2*100)}))});
w("fresh-fish-split-strength-ranking.source.json",{kind:"calculated",inputs:inputs("2021-2025"),formula:"県庁所在市を経度の順に並べ、前から8〜39番目までの位置で2群に分けたとき、魚種ごとの支出額の対数指数（47市の平均=0、都市ごとの魚介全体の水準を除く）の分散のうち2群の違いで説明できる割合の最大値と、その位置の前後の都市。経度は並べ替えにだけ使う概数",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
// null distribution
const nullMax=[]; for(let t=0;t<4000;t++){const perm=[...L.tuna];for(let i=perm.length-1;i>0;i--){const j=Math.floor(C.rnd()*(i+1));[perm[i],perm[j]]=[perm[j],perm[i]];}nullMax.push(C.bestSplit(perm).r2);} nullMax.sort((a,b)=>a-b);
// 5) species maps (5y avg yen)
for(const [k,n,file] of [["tuna","まぐろ","tuna"],["sea-bream","たい","sea-bream"]]){const av=C.avg(k,WIN);w(`${file}-east-west-map.json`,{title:`${n}の年間支出額（県庁所在市）`,subtitle:"2021〜2025年の平均",unit:"円",source:SRC,scheme:file==="tuna"?"Blues":"Reds",data:PREF.map((nm,i)=>({areaName:nm,value:Math.round(av[i])}))});
 w(`${file}-east-west-map.source.json`,{kind:"metric",metricKey:`${k}-consumption-expenditure`,year:"2021-2025",transform:"2021〜2025年の5年の単純平均（円）",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});}
// 6) region composition
const BLOCKS=[["北海道・東北",[0,1,2,3,4,5,6]],["関東",[7,8,9,10,11,12,13]],["北陸・甲信",[14,15,16,17,18,19]],["東海",[20,21,22,23]],["近畿",[24,25,26,27,28,29]],["中国・四国",[30,31,32,33,34,35,36,37,38]],["九州・沖縄",[39,40,41,42,43,44,45,46]]];
const CATS=[["まぐろ",["tuna"]],["さけ",["salmon"]],["たい",["sea-bream"]],["ぶり",["yellowtail"]],["かつお",["bonito"]],["あじ・いわし・さば・さんま・かれい",["horse-mackerel","sardine","mackerel","saury","flounder"]],["いか・たこ・えび・かに",["squid","octopus","shrimp","crab"]],["貝類（あさり・しじみ・かき・ほたて）",["clam","freshwater-clam","oyster","scallop"]]];
function shares(vals){const tot=vals.reduce((a,b)=>a+b,0);const raw=vals.map(v=>v/tot*1000);const fl=raw.map(Math.floor);let rem=1000-fl.reduce((a,b)=>a+b,0);raw.map((v,i)=>[v-fl[i],i]).sort((a,b)=>b[0]-a[0]).slice(0,rem).forEach(([,i])=>fl[i]++);return fl.map(v=>v/10);}
const avAll=Object.fromEntries(SPECIES.map(([k])=>[k,C.avg(k,WIN)]));
const cityTotal=CITY.map((_,i)=>SPECIES.reduce((s,[k])=>s+avAll[k][i],0));
const comp=BLOCKS.map(([bn,ix])=>{const per=CATS.map(([cn,ks])=>C.mean(ix.map(i=>ks.reduce((s,k)=>s+avAll[k][i],0)/cityTotal[i]*100)));const sh=shares(per);const row={label:bn};CATS.forEach(([cn],j)=>row[cn]=sh[j]);return row;});
w("fresh-fish-region-composition.json",{title:"生鮮魚介18種の支出の内訳（地方ブロック別）",year:"2021〜2025",unit:"％",source:SRC,normalized:true,data:comp});
w("fresh-fish-region-composition.source.json",{kind:"calculated",inputs:inputs("2021-2025"),formula:"各都市で18魚種の年間支出額（2021〜2025年平均）の合計に占める魚種の割合を出し、地方ブロック内の都市で単純平均した（合計100.0に丸め）",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
// summary extras
summary.pca={windows:Object.fromEntries(Object.entries(WINS).map(([nm,ws])=>{const p=C.pca(ws);return [nm,p.slice(0,3).map(q=>({varPct:r1(q.varPct),corrLon:r2(q.corrLon),corrLat:r2(q.corrLat)}))];})),
 scoreCorrAcrossWindows:{pc1_2021_25_vs_2015_19:r2(C.corr(pc[0].score,C.pca(WINS["2015〜2019"])[0].score)),pc1_vs_2009_13:r2(C.corr(pc[0].score,C.pca(WINS["2009〜2013"])[0].score)),pc2_vs_2015_19:r2(C.corr(pc[1].score,C.pca(WINS["2015〜2019"])[1].score)),pc2_vs_2009_13:r2(C.corr(pc[1].score,C.pca(WINS["2009〜2013"])[1].score))},
 loadingsPC1:SPECIES.map(([k,n],j)=>[n,r2(PC1.vec[j])]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])),loadingsPC2:SPECIES.map(([k,n],j)=>[n,r2(PC2.vec[j])]).sort((a,b)=>Math.abs(b[1])-Math.abs(a[1])),
 pc1Scores:CITY.map((c,i)=>[c,r2(PC1.score[i])]).sort((a,b)=>b[1]-a[1]),pc2Scores:CITY.map((c,i)=>[c,r2(PC2.score[i])]).sort((a,b)=>b[1]-a[1]),
 pc1BestSplit:(()=>{const b=C.bestSplit(PC1.score);return {r2:r2(b.r2),boundary:`${CITY[C.order[b.c-1]]}|${CITY[C.order[b.c]]}`};})(),
 signAlongLongitude:C.order.map(i=>`${CITY[i]}${PC1.score[i]>0?"+":"-"}`)};
summary.split={nullBestSplitR2:{n:4000,median:r2(nullMax[2000]),p95:r2(nullMax[3800]),p99:r2(nullMax[3960])},species:split.map(o=>({species:o.species,r2:r2(o.r2),boundary:`${o.west}|${o.east}`,eastOverWest:r2(o.eastOverWest)})),byWindow:splitWin};
summary.composition=comp;
summary.firstPlaceCounts=Object.fromEntries(CITY.map((c,i)=>[c,cnt[i]]).filter(([,v])=>v>0));
summary.longitudeNote="県庁所在地の経度は国土地理院の値ではなく、並べ替えと相関に使うための概数 (小数第2位)";
w("analysis-summary.json",summary);
w("analysis-summary.source.json",{kind:"calculated",inputs:inputs("2007-2025"),formula:"本文の数値の計算過程",generatedBy:"scratchpad/k022/build.mjs",displaySources:dispSrc});
console.log(JSON.stringify(summary.winners.map(o=>[o.species,o.winner2025,o.winner5y,o.winsOfWinner5y,o.winsOfWinner2025])));console.log(JSON.stringify(summary.split.nullBestSplitR2),JSON.stringify(summary.pca.scoreCorrAcrossWindows),JSON.stringify(summary.pca.pc1BestSplit));console.log(JSON.stringify(comp));
// ---- 追加の検査
{
const rank=a=>{const o=a.map((v,i)=>[v,i]).sort((x,y)=>y[0]-x[0]);const r=new Array(a.length);let i=0;while(i<o.length){let j=i;while(j+1<o.length&&o[j+1][0]===o[i][0])j++;const rk=(i+j)/2+1;for(let k=i;k<=j;k++)r[o[k][1]]=rk;i=j+1;}return r};
const ratio=summary.winners.map(o=>o.value5y/o.secondValue5y), wins=summary.winners.map(o=>o.winsOfWinner5y);
summary.stability={ratio1to2:summary.winners.map((o,i)=>[o.species,r2(ratio[i]),o.winsOfWinner5y]),spearmanRatioWins:r2(C.corr(rank(ratio),rank(wins)))};
// 那覇の指数
const nIdx=SPECIES.map(([k,n])=>[n,r2(avAll[k][CITY.indexOf("那覇市")]/C.mean(avAll[k]))]).sort((a,b)=>b[1]-a[1]);summary.naha={indexTop:nIdx.slice(0,5),indexBottom:nIdx.slice(-5)};
const sIdx=SPECIES.map(([k,n])=>[n,r2(avAll[k][CITY.indexOf("札幌市")]/C.mean(avAll[k]))]).sort((a,b)=>b[1]-a[1]);summary.sapporo={indexTop:sIdx.slice(0,5),indexBottom:sIdx.slice(-5)};
// 外れ値を除いた第1主成分
const drop=new Set([CITY.indexOf("那覇市"),CITY.indexOf("札幌市")]);
const keep=CITY.map((_,i)=>i).filter(i=>!drop.has(i));
const M=keep.map(i=>SPECIES.map(([k])=>L[k][i]));const mu=SPECIES.map((_,j)=>C.mean(M.map(r=>r[j])));const X=M.map(r=>r.map((v,j)=>v-mu[j]));const p=SPECIES.length;
const Cv=Array.from({length:p},(_,a)=>Array.from({length:p},(_,b)=>X.reduce((s,r)=>s+r[a]*r[b],0)/(X.length-1)));const {vals,vecs}=C.jacobi(Cv);const idx=vals.map((_,i)=>i).sort((a,b)=>vals[b]-vals[a]);const tv=vals.reduce((s,v)=>s+v,0);
const sc=X.map(r=>r.reduce((s,v,j)=>s+v*vecs[j][idx[0]],0));summary.withoutSapporoNaha={varPct1:r1(vals[idx[0]]/tv*100),varPct2:r1(vals[idx[1]]/tv*100),corrLon:r2(Math.abs(C.corr(sc,keep.map(i=>LON[i]))))};
summary.pc12VarPct=r1(summary.pca.windows["2021〜2025"][0].varPct+summary.pca.windows["2021〜2025"][1].varPct);
summary.winnersMismatch2025=summary.winners.filter(o=>o.winner2025!==o.winner5y).map(o=>[o.species,o.winner2025,o.winner5y]);
w("analysis-summary.json",summary); console.log(JSON.stringify(summary.stability),JSON.stringify(summary.naha),JSON.stringify(summary.sapporo),JSON.stringify(summary.withoutSapporoNaha),summary.pc12VarPct,JSON.stringify(summary.winnersMismatch2025));
}

// ---- 頑健性の検査
{ const WIN2=[2021,2022,2023,2024,2025];
// quantity version
const VQ={}; for(const [k] of SPECIES){const j=JSON.parse(fs.readFileSync(`/tmp/k22q/${k}.json`));const by={};for(const r of j.rows){by[r.yearCode]??=new Array(47).fill(null);by[r.yearCode][Number(r.areaCode.slice(0,2))-1]=r.value;}VQ[k]=by;}
const ys=Object.keys(VQ.tuna).sort();//,ys[0],ys[ys.length-1], "nulls", SPECIES.some(([k])=>VQ[k][2025].some(v=>v==null||v===0)));
function pcaFrom(get,drop=null){const L={};for(const [k] of SPECIES){if(k===drop)continue;const a=CITY.map((_,i)=>C.mean(WIN2.map(y=>get(k)[y][i])));const m=C.mean(a);L[k]=a.map(v=>Math.log(v/m));}
 const ks=Object.keys(L);for(let i=0;i<CITY.length;i++){const lv=C.mean(ks.map(k=>L[k][i]));for(const k of ks)L[k][i]-=lv;}const M=CITY.map((_,i)=>ks.map(k=>L[k][i]));const mu=ks.map((_,j)=>C.mean(M.map(r=>r[j])));const X=M.map(r=>r.map((v,j)=>v-mu[j]));const p=ks.length;
 const Cv=Array.from({length:p},(_,a)=>Array.from({length:p},(_,b)=>X.reduce((s,r)=>s+r[a]*r[b],0)/46));const {vals,vecs}=C.jacobi(Cv);const idx=vals.map((_,i)=>i).sort((a,b)=>vals[b]-vals[a]);const tv=vals.reduce((s,v)=>s+v,0);
 return [0,1].map(q=>{const e=idx[q];let sc=X.map(r=>r.reduce((s,v,j)=>s+v*vecs[j][e],0));if(C.corr(sc,LON)<0)sc=sc.map(v=>-v);return {var:vals[e]/tv*100,score:sc};});}
const expP=pcaFrom(k=>C.V[k]), qty=pcaFrom(k=>VQ[k]);
//log1,exp.map(x=>x.var.toFixed(1)),"qty var",qty.map(x=>x.var.toFixed(1)),"corr PC1",C.corr(expP[0].score,qty[0].score).toFixed(2),"PC2 abs",Math.abs(C.corr(expP[1].score,qty[1].score)).toFixed(2),"qty PC1~lon",C.corr(qty[0].score,LON).toFixed(2));
// leave-one-species-out
const out=[];for(const [k,n] of SPECIES){const p=pcaFrom(kk=>C.V[kk],k);out.push([n,C.corr(expP[0].score,p[0].score).toFixed(3),p[0].var.toFixed(1)]);}
//(o=>o.join(":")).join(" "));
const corrs=out.map(o=>+o[1]);
// 2-cluster k-means on log-index (expenditure)
const L2=C.logIdx(WIN2);const M=CITY.map((_,i)=>SPECIES.map(([k])=>L2[k][i]));
function kmeans(M,init){let c=init.map(i=>M[i].slice());let asg=new Array(M.length).fill(0);for(let it=0;it<100;it++){const na=M.map(r=>{let b=0,bd=1e18;c.forEach((cc,ci)=>{const d=r.reduce((s,v,j)=>s+(v-cc[j])**2,0);if(d<bd){bd=d;b=ci;}});return b;});if(na.every((v,i)=>v===asg[i]))break;asg=na;c=c.map((_,ci)=>{const mem=M.filter((_,i)=>asg[i]===ci);return mem.length?mem[0].map((_,j)=>C.mean(mem.map(r=>r[j]))):c[ci];});}return asg;}
const a=kmeans(M,[CITY.indexOf("静岡市"),CITY.indexOf("福岡市")]);
const east=CITY.filter((_,i)=>a[i]===0), west=CITY.filter((_,i)=>a[i]===1);
const sign=expP[0].score.map(v=>v>0?0:1);let agree=0;a.forEach((v,i)=>{if(v===sign[i])agree++;});

summary.robustness={quantityBased:{varPct:[r1(qty[0].var),r1(qty[1].var)],pc1CorrWithExpenditureBased:r2(C.corr(expP[0].score,qty[0].score)),pc2CorrAbs:r2(Math.abs(C.corr(expP[1].score,qty[1].score))),pc1CorrLongitude:r2(C.corr(qty[0].score,LON))},
 leaveOneSpeciesOut:{minCorr:Math.min(...corrs),minSpecies:out.find(o=>+o[1]===Math.min(...corrs))[0],all:out.map(o=>[o[0],+o[1]])},
 kmeans2:{east:east,west:west,agreeWithPC1Sign:agree,disagree:CITY.filter((c,i)=>a[i]!==sign[i])}};
w("analysis-summary.json",summary); console.log(JSON.stringify(summary.robustness).slice(0,900)); }
{ const Lraw=C.logIdx(WIN,false); const lv=CITY.map((_,i)=>C.mean(SPECIES.map(([k])=>Lraw[k][i])));
  const ord=lv.map((v,i)=>[CITY[i],r2(Math.exp(v))]).sort((a,b)=>a[1]-b[1]);
  summary.cityLevel={definition:"都市ごとの、18魚種の指数（47市の平均=1）の幾何平均。東西スコアなどはこの水準を引いた対数指数から作る",lowest:ord.slice(0,6),highest:ord.slice(-6),naha:ord.find(o=>o[0]==="那覇市")};
  w("analysis-summary.json",summary); console.log(JSON.stringify(summary.cityLevel)); }

{ const avT=C.avg("tuna",WIN), avB=C.avg("sea-bream",WIN); const g=(av,c)=>Math.round(av[CITY.indexOf(c)]);
  summary.mapNotes={tuna:{mean:Math.round(C.mean(avT)),shizuoka:g(avT,"静岡市"),kofu:g(avT,"甲府市"),shizuokaRatio:r2(g(avT,"静岡市")/C.mean(avT)),kofuRatio:r2(g(avT,"甲府市")/C.mean(avT)),westAboveMean:[["大阪市",g(avT,"大阪市")],["高知市",g(avT,"高知市")],["那覇市",g(avT,"那覇市")]]},seaBream:{mean:Math.round(C.mean(avB)),kumamoto:g(avB,"熊本市"),kobe:g(avB,"神戸市"),eastAboveMean:[["東京都区部",g(avB,"東京都区部")],["横浜市",g(avB,"横浜市")]]}};
  w("analysis-summary.json",summary); console.log(JSON.stringify(summary.mapNotes)); }
{ const L=C.logIdx(WIN); const M=CITY.map((_,i)=>SPECIES.map(([k])=>L[k][i]));
  function run(init){let c=init.map(i=>M[i].slice());let asg=new Array(47).fill(0);for(let it=0;it<200;it++){const na=M.map(r=>{let b=0,bd=1e18;c.forEach((cc,ci)=>{const d=r.reduce((s,v,j)=>s+(v-cc[j])**2,0);if(d<bd){bd=d;b=ci;}});return b;});if(na.every((v,i)=>v===asg[i]))break;asg=na;c=c.map((_,ci)=>{const mem=M.filter((_,i)=>asg[i]===ci);return mem.length?mem[0].map((_,j)=>C.mean(mem.map(r=>r[j]))):c[ci];});}
   const ss=M.reduce((s,r,i)=>s+r.reduce((t,v,j)=>t+(v-c[asg[i]][j])**2,0),0);return {asg,ss};}
  let best=null; for(let t=0;t<300;t++){const a=Math.floor(C.rnd()*47),b=Math.floor(C.rnd()*47);if(a===b)continue;const r=run([a,b]);if(!best||r.ss<best.ss-1e-9)best=r;}
  const eg=best.asg[CITY.indexOf("札幌市")]; const p=C.pca(WIN)[0].score;
  summary.robustness.kmeans2={input:"主分析と同じ（魚介全体の水準を除いた対数指数）。初期値をランダムに300回変えて群内の平方和が最小のものを採用",east:CITY.filter((_,i)=>best.asg[i]===eg),west:CITY.filter((_,i)=>best.asg[i]!==eg),agreeWithPC1Sign:CITY.filter((_,i)=>(best.asg[i]===eg)===(p[i]>0)).length};
  w("analysis-summary.json",summary); console.log(JSON.stringify(summary.robustness.kmeans2).slice(0,400)); }
