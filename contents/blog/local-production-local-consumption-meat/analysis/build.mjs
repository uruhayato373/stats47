import fs from "node:fs"; import path from "node:path"; import {CITY,PREF} from "../k022/common.mjs";
const SLUG="local-production-local-consumption-meat";
const OUT=`/Users/minamidaisuke/stats47/contents/blog/${SLUG}/data`; fs.mkdirSync(OUT,{recursive:true});
const w=(n,o)=>fs.writeFileSync(path.join(OUT,n),JSON.stringify(o,null,2)+"\n");
const R=f=>JSON.parse(fs.readFileSync(`/tmp/k15/${f}.json`));
const by=(f,y)=>{const a=new Array(47).fill(null);for(const r of R(f).rows) if(r.yearCode==String(y)) a[Number(r.areaCode.slice(0,2))-1]=r.value;return a;};
const sh=JSON.parse(fs.readFileSync(new URL("./share2020.json",import.meta.url)));
const prodShare=code=>PREF.map((_,i)=>{const v=sh.vals.find(x=>x["@cat01"]===String(i+1).padStart(3,"0")&&x["@cat02"]===code)["$"];return /^[0-9.]+$/.test(v)?Number(v):(v==="-"?0:null);});
const mean=a=>a.reduce((s,x)=>s+x,0)/a.length; const r1=x=>Math.round(x*10)/10, r2=x=>Math.round(x*100)/100, r3=x=>Math.round(x*1000)/1000;
const rank=a=>{const o=a.map((v,i)=>[v,i]).sort((x,y)=>y[0]-x[0]);const r=new Array(a.length);let i=0;while(i<o.length){let j=i;while(j+1<o.length&&o[j+1][0]===o[i][0])j++;const rk=(i+j)/2+1;for(let k=i;k<=j;k++)r[o[k][1]]=rk;i=j+1;}return r};
const pear=(a,b)=>{const ma=mean(a),mb=mean(b);let n=0,da=0,db=0;a.forEach((x,i)=>{n+=(x-ma)*(b[i]-mb);da+=(x-ma)**2;db+=(b[i]-mb)**2});return n/Math.sqrt(da*db)};
const spear=(a,b,ok)=>{const ia=[...a.keys()].filter(ok);return pear(rank(ia.map(i=>a[i])),rank(ia.map(i=>b[i])));};
let seed=12345; const rnd=()=>{seed=(seed*1664525+1013904223)%4294967296;return seed/4294967296;};
function permP(a,b,ok,obs){const ia=[...a.keys()].filter(ok);const x=rank(ia.map(i=>a[i])),y=ia.map(i=>b[i]);const ry=rank(y);let c=0;const N=20000;for(let t=0;t<N;t++){const p=[...ry];for(let i=p.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[p[i],p[j]]=[p[j],p[i]];}if(Math.abs(pear(x,p))>=Math.abs(obs)-1e-12)c++;}return (c+1)/(N+1);}
const pop=by("pop",2020), popT=pop.reduce((a,b)=>a+b,0), popShare=pop.map(v=>v/popT*100);
const MEATS=[["beef","牛肉","015"],["pork","豚肉","018"],["chicken","鶏肉","021"]];
const summary={year:2020,population:"total-population 2020",meats:{}};
const corrRows=[], topRows=[], trendSeries=[];
const SRC="家計調査・生産農業所得統計";
const dispSrc=[{label:"家計調査",surveyId:"kakei-chousa"},{label:"生産農業所得統計",url:"https://www.e-stat.go.jp/stat-search/database?statdisp_id=0002006790"}];
for(const [m,jp,code] of MEATS){
  const ps=prodShare(code), ok=i=>ps[i]!==null; const lq=ps.map((v,i)=>v===null?null:v/popShare[i]);
  const q=by(`${m}-quantity`,2020), e=by(`${m}-expenditure`,2020), price=e.map((v,i)=>v/q[i]*100);
  const sp={qLQ:spear(lq,q,ok),eLQ:spear(lq,e,ok),pLQ:spear(lq,price,ok),qShare:spear(ps,q,ok),eShare:spear(ps,e,ok),pShare:spear(ps,price,ok)};
  const p={qLQ:permP(lq,q,ok,sp.qLQ),eLQ:permP(lq,e,ok,sp.eLQ),pLQ:permP(lq,price,ok,sp.pLQ),qShare:permP(ps,q,ok,sp.qShare)};
  const avg3=(f)=>PREF.map((_,i)=>mean([2019,2020,2021].map(y=>by(f,y)[i])));
  const q3=avg3(`${m}-quantity`),e3=avg3(`${m}-expenditure`);
  const yearly=[];for(let y=2007;y<=2025;y++)yearly.push({year:y,value:r2(spear(lq,by(`${m}-quantity`,y),ok))});
  const yearlyShare=[];for(let y=2007;y<=2025;y++)yearlyShare.push({year:y,value:r2(spear(ps,by(`${m}-quantity`,y),ok))});
  trendSeries.push({label:jp,data:yearly});
  const rq=rank(q), re=rank(e), rl=rank(lq.map(v=>v===null?-1:v)), rs=rank(ps.map(v=>v===null?-1:v));
  const mq=mean(q), me=mean(e);
  const topShare=[...ps.keys()].filter(ok).sort((a,b)=>ps[b]-ps[a]).slice(0,5).map(i=>({pref:PREF[i],city:CITY[i],sharePct:ps[i],lq:r2(lq[i]),qtyG:q[i],qtyRank:rq[i],qtyIndex:Math.round(q[i]/mq*100),expYen:e[i],expRank:re[i],pricePer100g:r1(price[i])}));
  const topCons=[...q.keys()].sort((a,b)=>q[b]-q[a]).slice(0,5).map(i=>({pref:PREF[i],city:CITY[i],qtyG:q[i],sharePct:ps[i],shareRank:ps[i]===null?null:rs[i],lq:lq[i]===null?null:r2(lq[i])}));
  const exclPrefs=[...ps.keys()].filter(i=>!ok(i)).map(i=>PREF[i]);
  summary.meats[jp]={spearman:Object.fromEntries(Object.entries(sp).map(([k,v])=>[k,r2(v)])),permP:Object.fromEntries(Object.entries(p).map(([k,v])=>[k,r3(v)])),avg3yr:{qLQ:r2(spear(lq,q3,ok)),eLQ:r2(spear(lq,e3,ok))},byYearQtyLQ:yearly,byYearQtyShare:yearlyShare,topProducers:topShare,topConsumers:topCons,nPrefectures:[...ps.keys()].filter(ok).length,excluded:exclPrefs,nationalMeanQtyG:Math.round(mq),halves:Object.fromEntries([['東日本（三重県以東）',i=>i<24],['西日本（滋賀県以西）',i=>i>=24]].map(([nm,sel])=>[nm,{n:[...ps.keys()].filter(i=>sel(i)&&ok(i)).length,spearmanQtyLQ:r2(spear(lq,q,i=>sel(i)&&ok(i)))}])),priceMean100g:r1(mean(price)),priceCheapest:[...price.keys()].sort((a,b)=>price[a]-price[b]).slice(0,3).map(i=>[CITY[i],r1(price[i])]),priceDearest:[...price.keys()].sort((a,b)=>price[b]-price[a]).slice(0,3).map(i=>[CITY[i],r1(price[i])]),topProducerPriceRank:topShare.map(t=>{const i=CITY.indexOf(t.city);return [t.city,t.pricePer100g,[...price.keys()].filter(j=>price[j]<price[i]).length+1];}),topLQ:[...ps.keys()].filter(ok).sort((a,b)=>lq[b]-lq[a]).slice(0,7).map(i=>({pref:PREF[i],city:CITY[i],lq:r2(lq[i]),sharePct:ps[i],qtyG:q[i],qtyRank:rq[i]})),mean2019:Math.round(mean(by(`${m}-quantity`,2019))),mean2020:Math.round(mq),nationalMeanExpYen:Math.round(me),totalShare:r1(ps.reduce((a,b)=>a+(b||0),0))};
  corrRows.push({label:`${jp} 購入量`,value:r2(sp.qLQ)},{label:`${jp} 支出額`,value:r2(sp.eLQ)},{label:`${jp} 100gあたり単価`,value:r2(sp.pLQ)});
  // scatter
  const pts=[...q.keys()].filter(ok).map(i=>({code:String(i+1).padStart(2,"0"),name:PREF[i],x:r2(lq[i]),y:q[i]}));
  w(`${m}-production-vs-purchase-scatter.json`,{title:`${jp}の産出の濃さと購入量`,chartType:"scatter",level:"prefecture",xLabel:"産出額の濃さ（人口あたり・全国平均=1）",yLabel:`${jp}の1世帯あたり年間購入量（g・県庁所在市）`,year:"2020",unit:"g",points:pts});
  w(`${m}-production-vs-purchase-scatter.source.json`,{kind:"calculated",inputs:[{rankingKey:`${m}-consumption-quantity`,year:"2020"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",cat02:code,time:"2020"}],formula:"x = 都道府県の農業産出額（"+jp.replace("肉","")+"）の全国シェア(%) ÷ 都道府県の人口の全国シェア(%)、y = 県庁所在市の二人以上の世帯の1世帯あたり年間購入量(g)。全て2020年",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc,expectedPointCount:pts.length,pearsonR:r2(pear(pts.map(p=>p.x),pts.map(p=>p.y))),...(exclPrefs.length?{excludedAreas:exclPrefs,exclusionReason:"生産農業所得統計で産出額が秘匿(x)の県。個々の経営体を特定できないため値が公表されていない"}:{})});
  // top3 rows for figure
  for(const t of topShare.slice(0,3)) topRows.push({label:`${t.city} ${jp}`,value:t.qtyIndex,pref:t.pref,sharePct:t.sharePct,qtyG:t.qtyG,qtyRank:t.qtyRank});
}
w("meat-correlation-ranking.json",{title:"産出の濃さと県庁所在市の消費の順位相関",year:"2020",unit:"順位相関係数",source:SRC,data:corrRows});
w("meat-correlation-ranking.source.json",{kind:"calculated",inputs:[{rankingKey:"beef-consumption-quantity",year:"2020"},{rankingKey:"pork-consumption-quantity",year:"2020"},{rankingKey:"chicken-consumption-quantity",year:"2020"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",time:"2020"}],formula:"都道府県の産出額の濃さ(産出額シェア÷人口シェア)と、県庁所在市の購入量・支出額・100gあたり単価(支出額÷購入量×100)のスピアマン順位相関係数。2020年。鶏肉は産出額が秘匿の6県を除く41県",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
w("meat-top-producers-ranking.json",{title:"産出上位3県の県庁所在市の購入量（47市の平均=100）",year:"2020",unit:"指数",source:SRC,data:topRows});
w("meat-top-producers-ranking.source.json",{kind:"calculated",inputs:[{rankingKey:"beef-consumption-quantity",year:"2020"},{rankingKey:"pork-consumption-quantity",year:"2020"},{rankingKey:"chicken-consumption-quantity",year:"2020"},{statsDataId:"0002006790",time:"2020"}],formula:"産出額シェア上位3県の県庁所在市の1世帯あたり年間購入量 ÷ 47市の単純平均 × 100。2020年",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
w("meat-correlation-by-year-timeseries.json",{title:"産出（2020年）と購入量の順位相関の推移",subtitle:"2007–2025年 · 単位：順位相関係数",unit:"順位相関係数",source:SRC,series:trendSeries});
w("meat-correlation-by-year-timeseries.source.json",{kind:"calculated",inputs:[{rankingKey:"beef-consumption-quantity",year:"2007-2025"},{rankingKey:"pork-consumption-quantity",year:"2007-2025"},{rankingKey:"chicken-consumption-quantity",year:"2007-2025"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",time:"2020"}],formula:"2020年の産出額の濃さと、各年の県庁所在市の購入量のスピアマン順位相関係数",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
// 2025 head counts cross-check
const bc=by("beef-cattle-count",2025), pc=by("pig-count",2024), pop25=by("pop",2025);
const x=(heads,m,y)=>{const q=by(`${m}-quantity`,y),e=by(`${m}-expenditure`,y),per=heads.map((h,i)=>h/pop25[i]);const all=()=>true;const top=[...heads.keys()].sort((a,b)=>heads[b]-heads[a]).slice(0,5);const rq=rank(q);return {qtySpearman:r2(spear(heads,q,all)),expSpearman:r2(spear(heads,e,all)),perCapitaQtySpearman:r2(spear(per,q,all)),top:top.map(i=>({pref:PREF[i],city:CITY[i],heads:heads[i],qtyRank:rq[i]}))};};
summary.headCountCheck={beef:{heads:"beef-cattle-count 2025",consumptionYear:2025,...x(bc,"beef",2025)},pork:{heads:"pig-count 2024",consumptionYear:2025,...x(pc,"pork",2025)}};
// by-region summary: production share sum vs consumption mean index
const REG={北海道:[0],東北:[1,2,3,4,5,6],関東:[7,8,9,10,11,12,13],中部:[14,15,16,17,18,19,20,21,22],近畿:[23,24,25,26,27,28,29],中国:[30,31,32,33,34],四国:[35,36,37,38],"九州・沖縄":[39,40,41,42,43,44,45,46]};
summary.regions={};
for(const [m,jp,code] of MEATS){const ps=prodShare(code),q=by(`${m}-quantity`,2020),mq=mean(q);summary.regions[jp]=Object.fromEntries(Object.entries(REG).map(([r,ix])=>[r,{prodSharePct:r1(ix.reduce((a,i)=>a+(ps[i]||0),0)),qtyIndex:Math.round(mean(ix.map(i=>q[i]))/mq*100),hiddenPrefs:ix.filter(i=>ps[i]===null).map(i=>PREF[i])}]));}

// --- 県内で買われる量が産出に占める割合の目安 / 上位3県への集中 / 豚肉の単価の散布図 / 取り除いた場合の頑健性
const absRows=[]; summary.absorption={assumptions:"産出額のシェアを生産量のシェアとみなし、県の購入量は県庁所在市の1世帯あたり購入量×世帯数で、世帯数は人口に比例するとみなす。目安 = (人口シェア ÷ 産出額シェア) × (県庁所在市の購入量 ÷ 47市の平均)",rows:[]};
summary.concentration={};
for(const [m,jp,code] of MEATS){
  const ps=prodShare(code), q=by(`${m}-quantity`,2020), mq=mean(q); const ok=i=>ps[i]!==null;
  const top=[...ps.keys()].filter(ok).sort((a,b)=>ps[b]-ps[a]).slice(0,3);
  summary.concentration[jp]={top3:top.map(i=>PREF[i]),prodShareTop3:r1(top.reduce((a,i)=>a+ps[i],0)),popShareTop3:r1(top.reduce((a,i)=>a+popShare[i],0)),popShares:top.map(i=>[PREF[i],r2(popShare[i])])};
  for(const i of top){ const v=popShare[i]/ps[i]*(q[i]/mq)*100; absRows.push({label:`${PREF[i]} ${jp}`,value:r1(v),prodSharePct:ps[i],popSharePct:r2(popShare[i]),qtyIndex:r2(q[i]/mq)}); summary.absorption.rows.push(absRows[absRows.length-1]); }
}
w("meat-local-absorption-ranking.json",{title:"県内の購入が産出に占める割合（全国の産出=購入と置く）",year:"2020",unit:"％",source:SRC,data:absRows});
w("meat-local-absorption-ranking.source.json",{kind:"calculated",inputs:[{rankingKey:"beef-consumption-quantity",year:"2020"},{rankingKey:"pork-consumption-quantity",year:"2020"},{rankingKey:"chicken-consumption-quantity",year:"2020"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",time:"2020"}],formula:summary.absorption.assumptions,generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
{ const ps=prodShare("018"), e=by("pork-expenditure",2020), q=by("pork-quantity",2020); const lq=ps.map((v,i)=>v/popShare[i]); const price=e.map((v,i)=>v/q[i]*100);
  const pts=PREF.map((n,i)=>({code:String(i+1).padStart(2,"0"),name:n,x:r2(lq[i]),y:r1(price[i])}));
  w("pork-production-vs-price-scatter.json",{title:"豚肉の産出の濃さと100gあたり単価",chartType:"scatter",level:"prefecture",xLabel:"産出額の濃さ（人口あたり・全国平均=1）",yLabel:"豚肉の100gあたり単価（円・県庁所在市）",year:"2020",unit:"円",points:pts});
  w("pork-production-vs-price-scatter.source.json",{kind:"calculated",inputs:[{rankingKey:"pork-consumption-expenditure",year:"2020"},{rankingKey:"pork-consumption-quantity",year:"2020"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",cat02:"018",time:"2020"}],formula:"x = 豚の産出額の全国シェア(%) ÷ 人口の全国シェア(%)、y = 県庁所在市の二人以上の世帯の豚肉の支出額(円) ÷ 購入量(g) × 100。2020年",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc,expectedPointCount:47,pearsonR:r2(pear(pts.map(p=>p.x),pts.map(p=>p.y)))});
}
summary.leaveOneOut={};
for(const [m,jp,code] of MEATS){ const ps=prodShare(code), ok=i=>ps[i]!==null; const lq=ps.map((v,i)=>v===null?null:v/popShare[i]); const q=by(`${m}-quantity`,2020);
  const top=[...ps.keys()].filter(ok).sort((a,b)=>lq[b]-lq[a]).slice(0,3); const r=[];
  for(const t of top) r.push([PREF[t],r2(spear(lq,q,i=>ok(i)&&i!==t))]);
  const all=[...ps.keys()].filter(ok); const vals=all.map(t=>spear(lq,q,i=>ok(i)&&i!==t));
  summary.leaveOneOut[jp]={dropTopLQ:r,min:r2(Math.min(...vals)),max:r2(Math.max(...vals)),dropTop3LQ:r2(spear(lq,q,i=>ok(i)&&!top.includes(i)))}; }

// --- 地方別 (産出の濃さと購入量の指数)
const REG2={北海道:[0],東北:[1,2,3,4,5,6],関東:[7,8,9,10,11,12,13],中部:[14,15,16,17,18,19,20,21,22],近畿:[23,24,25,26,27,28,29],中国:[30,31,32,33,34],四国:[35,36,37,38],九州:[39,40,41,42,43,44,45,46]};
summary.regionIndex={};
for(const [m,jp,code] of MEATS.filter(x=>x[0]!=="pork")){ const ps=prodShare(code), q=by(`${m}-quantity`,2020), mq=mean(q);
  const rows=Object.entries(REG2).map(([r,ix])=>({r,prodDensity:Math.round(ix.reduce((a,i)=>a+(ps[i]||0),0)/ix.reduce((a,i)=>a+popShare[i],0)*100),qtyIndex:Math.round(mean(ix.map(i=>q[i]))/mq*100),hidden:ix.filter(i=>ps[i]===null).map(i=>PREF[i])}));
  summary.regionIndex[jp]=rows;
  w(`${m}-region-index-timeseries.json`,{title:`${jp}の地方別の産出の濃さと購入量`,subtitle:"2020年 · 単位：全国=100",unit:"指数",source:SRC,series:[{label:"産出の濃さ",data:rows.map(o=>({x:o.r,value:o.prodDensity}))},{label:"購入量",data:rows.map(o=>({x:o.r,value:o.qtyIndex}))}]});
  w(`${m}-region-index-timeseries.source.json`,{kind:"calculated",inputs:[{rankingKey:`${m}-consumption-quantity`,year:"2020"},{rankingKey:"total-population",year:"2020"},{statsDataId:"0002006790",time:"2020"}],formula:"産出の濃さ = 地方内の都道府県の産出額シェアの合計 ÷ 地方内の人口シェアの合計 ×100。購入量 = 地方内の県庁所在市の購入量の単純平均 ÷ 47市の単純平均 ×100。沖縄県は九州に含める"+(m==="chicken"?"。秘匿の県(秋田県、山形県、栃木県、埼玉県、滋賀県、奈良県)は産出を0として合計しており、その地方の産出の濃さは過小になる":""),generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
}
w("analysis-summary.json",summary);
w("analysis-summary.source.json",{kind:"calculated",inputs:[{rankingKey:"beef-consumption-quantity",year:"2020"},{rankingKey:"beef-cattle-count",year:"2025"},{rankingKey:"pig-count",year:"2024"},{statsDataId:"0002006790",time:"2020"}],formula:"本文の数値の計算過程",generatedBy:"scratchpad/k015/build.mjs",displaySources:dispSrc});
console.log(JSON.stringify(Object.fromEntries(Object.entries(summary.meats).map(([k,v])=>[k,{sp:v.spearman,p:v.permP,a3:v.avg3yr,n:v.nPrefectures}])),null,0));
console.log(JSON.stringify(summary.headCountCheck)); console.log(JSON.stringify(summary.regions));
for(const [k,v] of Object.entries(summary.meats)) console.log(k,"TOP",JSON.stringify(v.topProducers.map(t=>[t.pref,t.sharePct,t.lq,t.qtyG,t.qtyRank,t.qtyIndex,t.expRank,t.pricePer100g]))); 
for(const [k,v] of Object.entries(summary.meats)) console.log(k,"CONS",JSON.stringify(v.topConsumers.map(t=>[t.city,t.qtyG,t.sharePct,t.shareRank])));
