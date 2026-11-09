import fs from "node:fs"; import path from "node:path";
import {info,S,T,A,HH} from "./lib.mjs"; import {AG,names} from "./lib2.mjs"; import {SZ,names as names3} from "./lib3.mjs";
const SLUG="single-household-spending-differences";
const OUT=`/Users/minamidaisuke/stats47/contents/blog/${SLUG}/data`; fs.mkdirSync(OUT,{recursive:true});
const C="001100000", Y=2025;
const w=(n,o)=>fs.writeFileSync(path.join(OUT,n),JSON.stringify(o,null,2)+"\n");
const r1=x=>Math.round(x*10)/10, r2=x=>Math.round(x*100)/100;
// largest remainder rounding to 1 decimal summing to 100.0
function shares(vals){const tot=vals.reduce((a,b)=>a+b,0);const raw=vals.map(v=>v/tot*1000);const fl=raw.map(Math.floor);let rem=1000-fl.reduce((a,b)=>a+b,0);
 const ord=raw.map((v,i)=>[v-fl[i],i]).sort((a,b)=>b[0]-a[0]);for(let k=0;k<rem;k++)fl[ord[k][1]]++;return fl.map(v=>v/10);}
const SRC_NAME="家計調査（総務省）";
const dispSrc=[{label:"家計調査",surveyId:"kakei-chousa"}];
const src=(extra)=>({kind:"estat",statsDataId:"0004023614",params:{tables:{single:"0004023614 cat02=21",twoOrMore:"0004023605 cat02=03",allHouseholds:"0004023612 cat02=11"},area:"00000",time:"2025"},generatedBy:"scratchpad/k07/build.mjs",displaySources:dispSrc,...extra});
const summary={};
// --- 1. 10大費目の構成比
const cats=[["食料","010000000"],["住居","020000000"],["光熱・水道","030000000"],["家具・家事用品","040000000"],["被服及び履物","050000000"],["保健医療","060000000"],["交通・通信","070000000"],["教育","080000000"],["教養娯楽","090000000"],["その他の消費支出","100000000"]];
const catsC=[["食料",["010000000"]],["住居",["020000000"]],["光熱・家具・被服",["030000000","040000000","050000000"]],["保健医療",["060000000"]],["交通・通信",["070000000"]],["教育",["080000000"]],["教養娯楽",["090000000"]],["その他の消費支出",["100000000"]]];
const sS=shares(catsC.map(([,c])=>c.reduce((a,k)=>a+S(k,Y),0))), tS=shares(catsC.map(([,c])=>c.reduce((a,k)=>a+T(k,Y),0)));
const rowS={label:"単身世帯"},rowT={label:"二人以上の世帯"}; catsC.forEach(([n],i)=>{rowS[n]=sS[i];rowT[n]=tS[i];});
w("household-category-share-composition.json",{title:"消費支出の使い道の割合（単身世帯と二人以上の世帯）",year:"2025",unit:"％",source:SRC_NAME,normalized:true,data:[rowS,rowT]});
w("household-category-share-composition.source.json",src({transform:"10大費目の年間支出額を消費支出で割った割合（％）。光熱・水道、家具・家事用品、被服及び履物は合計して1区分にした。小数第1位へ丸め、合計を100.0に合わせた"}));
// --- 2. 1人あたりに直した比
const hh=HH(Y);
const ppRows=cats.map(([n,c])=>({label:n,value:r2(S(c,Y)/(T(c,Y)/hh))}));
const hhRows=cats.map(([n,c])=>({label:n,value:r2(S(c,Y)/T(c,Y))}));
const consPP=r2(S(C,Y)/(T(C,Y)/hh)), consHH=r2(S(C,Y)/T(C,Y));
w("household-per-person-ratio-ranking.json",{title:"1人あたりに直した単身世帯の支出（二人以上の世帯=1）",year:"2025",unit:"倍",source:SRC_NAME,data:ppRows});
w("household-per-person-ratio-ranking.source.json",src({transform:`単身世帯の年間支出額 ÷ （二人以上の世帯の年間支出額 ÷ 二人以上の世帯の平均世帯人員${hh}人）。単身世帯の世帯人員は1人`}));
// --- 3. 食料の中身
const fg=[["外食","011200000"],["調理食品","010900000"],["菓子・飲料・酒類",["010800000","011000000","011100000"]],["野菜・海藻","010500000"],["穀類","010100000"],["肉類","010300000"],["魚介類","010200000"],["乳卵・果物・調味料ほか",["010400000","010600000","010700000","011300001"]]];
const fv=(f,Yr)=>fg.map(([n,c])=>[].concat(c).reduce((s,k)=>s+f(k,Yr),0));
const fS=shares(fv(S,Y)),fT=shares(fv(T,Y));
const fr1={label:"単身世帯"},fr2={label:"二人以上の世帯"}; fg.forEach(([n],i)=>{fr1[n]=fS[i];fr2[n]=fT[i];});
w("household-food-share-composition.json",{title:"食料の使い道の割合（単身世帯と二人以上の世帯）",year:"2025",unit:"％",source:SRC_NAME,normalized:true,data:[fr1,fr2]});
w("household-food-share-composition.source.json",src({transform:"食料の中分類の年間支出額を食料で割った割合（％）。小数第1位へ丸め合計を100.0に合わせた。菓子・飲料・酒類は菓子類と飲料と酒類の合計、乳卵・果物・調味料ほかは乳卵類・果物・油脂調味料・賄い費の合計"}));
// --- 4. 指数
const idxOf=c=>(S(c,Y)/S(C,Y))/(T(c,Y)/T(C,Y));
const idxRange=c=>{const a=[];for(let y=2019;y<=2025;y++){const s=S(c,y),t=T(c,y);if(s&&t)a.push((s/S(C,y))/(t/T(C,y)));}return [Math.min(...a),Math.max(...a)];};
const over=[["民営家賃","020100010"],["給与住宅家賃","020100030"],["タクシー代","070100070"],["飲酒代（外食）","011212020"],["たばこ","100140001"],["鉄道運賃","070100010"],["贈与金（香典・祝儀など）","100360001"],["映画・演劇等入場料","090442010"],["弁当","010910010"],["NHK放送受信料","090441010"]];
const under=[["自動車購入","070210010"],["豚肉","010310020"],["鶏肉","010310030"],["牛肉","010310010"],["医療保険料","100150060"],["生鮮魚介","010210000"],["米","010110001"],["卵","010430001"],["調味料","010720000"],["生鮮野菜","010510000"]];
const mk=(arr)=>arr.map(([n,c])=>({label:n,value:r2(idxOf(c)),code:c,singleYen:S(c,Y),twoOrMoreYen:T(c,Y),range2019_2025:idxRange(c).map(r2)}));
const overRows=mk(over),underRows=mk(under);
w("household-more-items-ranking.json",{title:"単身世帯で割合が大きい品目（二人以上の世帯=1）",year:"2025",unit:"倍",source:SRC_NAME,data:overRows});
w("household-more-items-ranking.source.json",src({transform:"品目の年間支出額が消費支出に占める割合を、単身世帯の割合 ÷ 二人以上の世帯の割合で比べた倍率。2019〜2025年の範囲は各年の同じ倍率の最小と最大"}));
w("household-less-items-ranking.json",{title:"単身世帯で割合が小さい品目（二人以上の世帯=1）",year:"2025",unit:"倍",source:SRC_NAME,data:underRows});
w("household-less-items-ranking.source.json",src({transform:"同上"}));
// --- 5/6 時系列
const ts=(name,code)=>["single","two"].map(k=>({label:(k==="single"?"単身世帯":"二人以上の世帯")+"の"+name,data:Array.from({length:26},(_,i)=>2000+i).map(y=>({year:y,value:r1((k==="single"?S(code,y):T(code,y))/(k==="single"?S(C,y):T(C,y))*100)}))}));
const food=[...ts("外食","011200000"),...ts("調理食品","010900000")];
w("household-eating-out-share-timeseries.json",{title:"外食と調理食品に使う割合の推移",unit:"％",source:SRC_NAME,series:food});
w("household-eating-out-share-timeseries.source.json",src({transform:"外食（品目分類1.12）と調理食品（同1.9）の年間支出額 ÷ 消費支出（％）。2000〜2025年"}));
w("household-rent-share-timeseries.json",{title:"家賃・地代に使う割合の推移",unit:"％",source:SRC_NAME,series:ts("家賃・地代","020100000")});
w("household-rent-share-timeseries.source.json",src({transform:"家賃地代（品目分類2.1）の年間支出額 ÷ 消費支出（％）。2000〜2025年"}));
// --- 7. 年齢×性別 (用途分類 2021-2025 pooled)
const cells=[["435","1","34歳以下の男"],["435","2","34歳以下の女"],["615","1","35〜59歳の男"],["615","2","35〜59歳の女"],["560","1","60歳以上の男"],["560","2","60歳以上の女"]];
const ys=[2021,2022,2023,2024,2025]; const code=n=>Object.keys(names).find(c=>names[c]===n);
const comp=[["外食","098"],["調理食品","090"],["家賃・地代","103"],["保健医療",code("保健医療")],["交通・通信",code("交通・通信")],["教養娯楽",code("教養娯楽")]];
const cellRows=[],cellInfo=[];
for(const [a,s,lab] of cells){ const n=ys.map(y=>AG("002",a,s,y)); const pool=c=>ys.reduce((sum,y,i)=>sum+n[i]*AG(c,a,s,y),0);
 const C0=pool("059"); const food0=pool("060"); const vals={}; let used=0;
 const parts=[["外食",pool("098")],["調理食品",pool("090")],["食料のその他",food0-pool("098")-pool("090")],["家賃・地代",pool("103")],["保健医療",pool(code("保健医療"))],["交通・通信",pool(code("交通・通信"))],["教養娯楽",pool(code("教養娯楽"))]];
 parts.forEach(p=>used+=p[1]); parts.push(["ほかの費目",C0-used]);
 const sh=shares(parts.map(p=>p[1])); const row={label:lab}; parts.forEach((p,i)=>row[p[0]]=sh[i]); cellRows.push(row);
 const nTot=n.reduce((x,y)=>x+y,0); const yr=ys.map(y=>({y,eat:r1(AG("098",a,s,y)/AG("059",a,s,y)*100),rent:r1(AG("103",a,s,y)/AG("059",a,s,y)*100)}));
 cellInfo.push({label:lab,householdsByYear:n,householdsTotal:nTot,monthlyConsumption:Math.round(C0/nTot),eatingOutRange:[Math.min(...yr.map(o=>o.eat)),Math.max(...yr.map(o=>o.eat))],rentRange:[Math.min(...yr.map(o=>o.rent)),Math.max(...yr.map(o=>o.rent))],headAge2025:AG("009",a,s,2025)}); }
w("single-age-sex-composition.json",{title:"単身世帯の使い道の割合（年齢と性別）",year:"2021〜2025",unit:"％",source:SRC_NAME,normalized:true,data:cellRows});
w("single-age-sex-composition.source.json",{kind:"estat",statsDataId:"0002190004",params:{cdCat02:"21",cdArea:"00000",time:"2021-2025"},generatedBy:"scratchpad/k07/build.mjs",transform:"用途分類の月平均支出額を各年の集計世帯数で重みづけして5年分をまとめ、消費支出に占める割合（％）に直した。食料のその他は食料から外食と調理食品を引いた値、ほかの費目は消費支出から表の7項目を引いた値",displaySources:dispSrc});
// --- summary
const shift=(()=>{ // 外食(用途分類) share aggregate 2007 vs 2025 decomposed by age group (3 groups, sexes pooled via A00? use cat04=0)
 const g=["435","615","560"]; const wt=y=>{const v=g.map(a=>AG("001",a,"0",y));const t=v.reduce((a,b)=>a+b,0);return v.map(x=>x/t);};
 const sh=y=>g.map(a=>AG("098",a,"0",y)/AG("059",a,"0",y)); // within-group share of consumption
 const cons=y=>g.map(a=>AG("059",a,"0",y));
 const agg=(w,s,c)=>{let e=0,t=0;w.forEach((x,i)=>{e+=x*s[i]*c[i];t+=x*c[i];});return e/t;};
 const out={}; for(const y of [2007,2019,2025]){out[y]={weights:wt(y).map(r1x),within:sh(y).map(x=>r1(x*100)),agg:r1(agg(wt(y),sh(y),cons(y))*100),A00:r1(AG("098","A00","0",y)/AG("059","A00","0",y)*100)};}
 // counterfactual: 2025 weights with 2007 within-group shares/cons
 out.cf_2025weights_2007within=r1(agg(wt(2025),sh(2007),cons(2007))*100);
 out.cf_2007weights_2025within=r1(agg(wt(2007),sh(2025),cons(2025))*100);
 return out; function r1x(x){return Math.round(x*1000)/10;}})();
const eq=(Math.sqrt(hh));
Object.assign(summary,{
 year:2025, households:{singleSample:S("000200000",Y),twoSample:T("000200000",Y),twoSize:hh,singleHeadAge:S("000800000",Y),twoHeadAge:T("000800000",Y),singleOwnRate:S("000900000",Y),twoOwnRate:T("000900000",Y),singleRentPayers:S("001000000",Y),twoRentPayers:T("001000000",Y)},
 consumption:{single:S(C,Y),twoOrMore:T(C,Y),all:A(C,Y),ratioHousehold:consHH,ratioPerPerson:consPP,ratioSqrtScale:r2(S(C,Y)/(T(C,Y)/eq)),impliedSingleShareOfAll:r1((T(C,Y)-A(C,Y))/(T(C,Y)-S(C,Y))*100)},
 perPerson:ppRows,perHousehold:hhRows,categoryShares:{single:sS,twoOrMore:tS,labels:catsC.map(c=>c[0])},foodShares:{single:fS,twoOrMore:fT,labels:fg.map(c=>c[0])},
 foodPerPerson:{food:r2(S("010000000",Y)/(T("010000000",Y)/hh)),eatingOut:r2(S("011200000",Y)/(T("011200000",Y)/hh)),prepared:r2(S("010900000",Y)/(T("010900000",Y)/hh)),meat:r2(S("010300000",Y)/(T("010300000",Y)/hh)),freshMeat:r2(S("010310000",Y)/(T("010310000",Y)/hh)),fish:r2(S("010200000",Y)/(T("010200000",Y)/hh)),rice:r2(S("010110001",Y)/(T("010110001",Y)/hh)),vegetables:r2(S("010500000",Y)/(T("010500000",Y)/hh)),alcoholOut:r2(S("011212020",Y)/(T("011212020",Y)/hh)),rentPrivate:r2(S("020100010",Y)/(T("020100010",Y)/hh)),car:r2(S("070210010",Y)/(T("070210010",Y)/hh))},
 moreItems:overRows,lessItems:underRows,
 ageSex:{cells:cellInfo,rows:cellRows},eatingOutShiftShare:shift,
 rentPerPayer:{singleRentYenPerYear:S("020100000",Y),perPayerYenPerYear:Math.round(S("020100000",Y)/(S("001000000",Y)/100))},
 trend:{eatOut2000:[r1(S("011200000",2000)/S(C,2000)*100),r1(T("011200000",2000)/T(C,2000)*100)],eatOut2021:[r1(S("011200000",2021)/S(C,2021)*100),r1(T("011200000",2021)/T(C,2021)*100)],eatOut2025:[r1(S("011200000",2025)/S(C,2025)*100),r1(T("011200000",2025)/T(C,2025)*100)],prepared2000:[r1(S("010900000",2000)/S(C,2000)*100),r1(T("010900000",2000)/T(C,2000)*100)],prepared2025:[r1(S("010900000",2025)/S(C,2025)*100),r1(T("010900000",2025)/T(C,2025)*100)],rent2000:[r1(S("020100000",2000)/S(C,2000)*100),r1(T("020100000",2000)/T(C,2000)*100)],rent2025:[r1(S("020100000",2025)/S(C,2025)*100),r1(T("020100000",2025)/T(C,2025)*100)]}
});

// --- 勤労者世帯どうし
const numW=x=>x==null||!/^-?[0-9.]+$/.test(x)?null:Number(x);
const mkW=f=>{const t={};for(const v of JSON.parse(fs.readFileSync(new URL("./"+f,import.meta.url))))t[v["@cat01"]+"|"+v["@time"].slice(0,4)]=numW(v["$"]);return t;};
const sw=mkW("singleW.json"), tw=mkW("twoW.json");
const idxW=(c,y)=>(sw[c+"|"+y]/sw[C+"|"+y])/(tw[c+"|"+y]/tw[C+"|"+y]);
const rangeW=c=>{const a=[];for(let y=2019;y<=2025;y++){const v=idxW(c,y);if(Number.isFinite(v))a.push(v);}return [Math.min(...a),Math.max(...a)].map(r2);};
const wk=[["民営家賃","020100010"],["鉄道運賃","070100010"],["飲酒代（外食）","011212020"],["弁当","010910010"],["外食","011200000"],["調理食品","010900000"],["交通・通信","070000000"],["米","010110001"],["生鮮魚介","010210000"],["生鮮肉","010310000"]];
const wkRows=wk.map(([n,c])=>({label:n,value:r2(idxW(c,2025)),code:c,singleWorkerYen:sw[c+"|2025"],twoOrMoreWorkerYen:tw[c+"|2025"],range2019_2025:rangeW(c)}));
w("household-workers-items-ranking.json",{title:"勤労者世帯どうしで比べた割合（二人以上の勤労者世帯=1）",year:"2025",unit:"倍",source:SRC_NAME,data:wkRows});
w("household-workers-items-ranking.source.json",{kind:"estat",statsDataId:"0004023614",params:{tables:{singleWorkers:"0004023614 cat02=22",twoOrMoreWorkers:"0004023605 cat02=04"},area:"00000",time:"2025"},generatedBy:"scratchpad/k07/build.mjs",transform:"単身の勤労者世帯と二人以上のうち勤労者世帯について、品目の年間支出額が消費支出に占める割合を 単身 ÷ 二人以上 で比べた倍率。2019〜2025年の範囲は各年の同じ倍率の最小と最大",displaySources:dispSrc});
summary.workers={sampleSingle:sw["000200000|2025"],sampleTwo:tw["000200000|2025"],householdSizeTwo:tw["000300000|2025"],headAgeSingle:sw["000800000|2025"],headAgeTwo:tw["000800000|2025"],ownRateSingle:sw["000900000|2025"],ownRateTwo:tw["000900000|2025"],rentPayersSingle:sw["001000000|2025"],rentPayersTwo:tw["001000000|2025"],consumptionSingle:sw[C+"|2025"],consumptionTwo:tw[C+"|2025"],
  food:{single:r1(sw["010000000|2025"]/sw[C+"|2025"]*100),two:r1(tw["010000000|2025"]/tw[C+"|2025"]*100)},housing:{single:r1(sw["020000000|2025"]/sw[C+"|2025"]*100),two:r1(tw["020000000|2025"]/tw[C+"|2025"]*100)},rows:wkRows,
  perPerson:{freshMeat:r2(sw["010310000|2025"]/(tw["010310000|2025"]/tw["000300000|2025"])),eatingOut:r2(sw["011200000|2025"]/(tw["011200000|2025"]/tw["000300000|2025"])),rice:r2(sw["010110001|2025"]/(tw["010110001|2025"]/tw["000300000|2025"])),consumption:r2(sw[C+"|2025"]/(tw[C+"|2025"]/tw["000300000|2025"]))}};
summary.impliedWeights=["001100000","010000000","020000000","030000000","070000000","090000000","011200000","010310000"].map(c=>({code:c,name:info[c].name,weightPct:r1((T(c,Y)-A(c,Y))/(T(c,Y)-S(c,Y))*100)}));

summary.textDerived={
 outPlusPreparedFoodShare:{single:r1(fS[0]+fS[1]),twoOrMore:r1(fT[0]+fT[1]),diffPoints:r1(fS[0]+fS[1]-fT[0]-fT[1])},
 rentShareOfHousing:r1(S("020100000",Y)/S("020000000",Y)*100),
 mealOutRatioHousehold:r1(S("011211000",Y)/T("011211000",Y)*100),
 bentoTwoPerPersonYen:Math.round(T("010910010",Y)/hh), bentoPerPersonRatioSingleToTwo:r2(S("010910010",Y)/(T("010910010",Y)/hh)),
 shareOfConsumption:{privateRent:{single:r2(S("020100010",Y)/S(C,Y)*100),twoOrMore:r2(T("020100010",Y)/T(C,Y)*100)},car:{single:r2(S("070210010",Y)/S(C,Y)*100),twoOrMore:r2(T("070210010",Y)/T(C,Y)*100)}},
 eatingOutAndPrepared2025:{single:r1((S("011200000",2025)+S("010900000",2025))/S(C,2025)*100),twoOrMore:r1((T("011200000",2025)+T("010900000",2025))/T(C,2025)*100)},
 eatingOutRatioSingleToTwo:{y2000:r2(S("011200000",2000)/S(C,2000)/(T("011200000",2000)/T(C,2000))),y2025:r2(S("011200000",2025)/S(C,2025)/(T("011200000",2025)/T(C,2025)))},
 rentShareRatioSingleToTwo:{y2000:r2(S("020100000",2000)/S(C,2000)/(T("020100000",2000)/T(C,2000))),y2025:r2(S("020100000",2025)/S(C,2025)/(T("020100000",2025)/T(C,2025)))},
 rentShareSingle:[2021,2022,2023,2024,2025].map(y=>r1(S("020100000",y)/S(C,y)*100)),
 rentRatioByYear:Object.fromEntries(Array.from({length:26},(_,i)=>2000+i).map(y=>[y,r2((S("020100000",y)/S(C,y))/(T("020100000",y)/T(C,y)))])),
 eatRecoverFrom2021:{single:r1(S("011200000",2025)/S(C,2025)*100-S("011200000",2021)/S(C,2021)*100),twoOrMore:r1(T("011200000",2025)/T(C,2025)*100-T("011200000",2021)/T(C,2021)*100)},
 housing:{singleRatio:r2((S("020000000",Y)/S(C,Y))/(T("020000000",Y)/T(C,Y)))},
 transport:{carRelated:[S("070200000",Y),T("070200000",Y)],transport:[S("070100000",Y),T("070100000",Y)],railFare:[S("070100010",Y),T("070100010",Y)]},
 education:{single:S("080000000",Y),twoOrMore:T("080000000",Y),tuition:T("080100000",Y),supplementary:T("080300000",Y)},
 twoOrMoreHousehold:{under18:T("000400000",Y),over65:T("000500000",Y)},
 allHouseholdsConsumption:A(C,Y),monthly:{single:Math.round(S(C,Y)/12),twoOrMore:Math.round(T(C,Y)/12)},
 usageTableFood2025:{yenPerYear:AG("060","A00","0",2025)*12,consumptionPerYear:AG("059","A00","0",2025)*12,eatingOutShare:r1(AG("098","A00","0",2025)/AG("059","A00","0",2025)*100)},
 ageSexOwnership2025:{le34:{male:AG("011","435","1",2025),female:AG("011","435","2",2025)},ge60:{male:AG("011","560","1",2025),female:AG("011","560","2",2025)}},
 eatingOutAgeSexRatio:r2(cellRows[0]["外食"]/cellRows[5]["外食"])
};

// --- 世帯人員別 (用途分類・二人以上の世帯の2人〜5人と単身世帯)
const sizeItems=[["肉類","071"],["生鮮魚介","067"],["米","062"],["外食","098"],["調理食品","090"],["酒類","097"]];
const perPersonYen=(c)=>[AG(c,"A00","0",Y),...["01","02","03","04"].map((sz,i)=>SZ(c,sz)/(i+2))];
const sizeSeries=sizeItems.map(([n,c])=>{const v=perPersonYen(c);return {label:n,data:v.map((x,i)=>({x:`${i+1}人`,value:Math.round(x/v[1]*100)}))};});
w("household-size-per-person-timeseries.json",{title:"世帯人員別の1人あたり支出（2人世帯=100）",subtitle:"2025年 · 単位：指数",unit:"指数",source:SRC_NAME,series:sizeSeries});
w("household-size-per-person-timeseries.source.json",{kind:"estat",statsDataId:"0002070009",params:{cdArea:"00000",cdTime:"2025000000",cdCat02:"03",cdCat03:"01,02,03,04",singleHousehold:"0002190004 cdCat02=21 cdCat03=A00 cdCat04=0"},generatedBy:"scratchpad/k07/build.mjs",transform:"用途分類の月平均支出額。二人以上の世帯の2〜5人の世帯を世帯人員(2〜5)で割った1人あたりの額と、単身世帯の1人の額を、2人世帯の1人あたりの額=100にそろえた指数",displaySources:dispSrc});
const sizeYen={}; for(const [n,c] of [...sizeItems,["消費支出","059"],["食料","060"],["家賃・地代","103"],["光熱・水道","107"],["交通・通信","145"],["保健医療","140"],["教養娯楽","156"],["生鮮肉","072"],["生鮮野菜","079"]]) sizeYen[n]=perPersonYen(c).map(Math.round);
summary.sizeComparison={unit:"1人あたり月平均円 (1人=単身世帯, 2〜5人=二人以上の世帯の人数別)",householdsInSample:["002"].flatMap(()=>["01","02","03","04"].map(sz=>SZ("002",sz))),yenPerPerson:sizeYen,index:Object.fromEntries(sizeSeries.map(s=>[s.label,s.data.map(d=>d.value)])),singleToTwoPerson:Object.fromEntries(Object.entries(sizeYen).map(([n,v])=>[n,r2(v[0]/v[1])]))};
// --- 本文が引く品目の金額と倍率
const keyList=[["生鮮肉","010310000"],["肉類","010300000"],["牛肉","010310010"],["豚肉","010310020"],["鶏肉","010310030"],["魚介類","010200000"],["生鮮魚介","010210000"],["米","010110001"],["野菜・海藻","010500000"],["外食","011200000"],["調理食品","010900000"],["飲酒代","011212020"],["民営家賃","020100010"],["家賃地代","020100000"],["自動車購入","070210010"],["医療保険料","100150060"],["食事代","011211000"],["弁当","010910010"]];
summary.keyItems=keyList.map(([n,c])=>({label:n,singleYen:S(c,Y),twoOrMoreYen:T(c,Y),householdRatio:r2(S(c,Y)/T(c,Y)),perPersonRatio:r2(S(c,Y)/(T(c,Y)/hh)),shareRatio:r2(idxOf(c)),singleSharePct:r2(S(c,Y)/S(C,Y)*100),twoOrMoreSharePct:r2(T(c,Y)/T(C,Y)*100)}));
// --- 外食の分解の入力
summary.eatingOutShiftShare.inputs={weightType:"世帯数分布(抽出率調整・一万分比)",groups:["34歳以下","35〜59歳","60歳以上"],byYear:Object.fromEntries([2007,2019,2025].map(y=>[y,["435","615","560"].map(a=>({group:a,weightPer10000:AG("001",a,"0",y),monthlyConsumption:AG("059",a,"0",y),monthlyEatingOut:AG("098",a,"0",y)}))]))};
w("analysis-summary.json",summary);
w("analysis-summary.source.json",src({kind:"estat",transform:"本文の数値の計算過程（単身世帯・二人以上の世帯・総世帯の2025年の値と各図の元の数）"}));
console.log(JSON.stringify(summary.consumption), JSON.stringify(summary.eatingOutShiftShare), JSON.stringify(summary.rentPerPayer), JSON.stringify(summary.foodPerPerson));
console.log(sS.join(" "),"|",tS.join(" ")); console.log(fS.join(" "),"|",fT.join(" "));
console.log(JSON.stringify(cellRows)); console.log(JSON.stringify(cellInfo.map(c=>[c.label,c.householdsTotal,c.monthlyConsumption,c.eatingOutRange,c.rentRange])));
