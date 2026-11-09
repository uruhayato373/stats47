import fs from "node:fs";
import { renderRelationshipScatterChart } from "/Users/minamidaisuke/stats47/apps/admin/lib/template-relationship-scatter";
import { CHART_THEMES } from "/Users/minamidaisuke/stats47/apps/remotion/src/features/data-cards/chart-theme";
const DIR="/Users/minamidaisuke/stats47/contents/blog/local-production-local-consumption-meat/data";
const LABELS:Record<string,string[]>={beef:["鹿児島県","北海道","宮崎県","京都府"],pork:["鹿児島県","宮崎県","北海道","神奈川県"],chicken:["宮崎県","鹿児島県","岩手県","熊本県"]};
LABELS["pork-price"]=["北海道","鹿児島県","新潟県","東京都"];
for(const m of ["beef","pork","chicken","pork-price"]){
  const base=m==="pork-price"?"pork-production-vs-price-scatter":`${m}-production-vs-purchase-scatter`;
  const j=JSON.parse(fs.readFileSync(`${DIR}/${base}.json`,"utf8"));
  const s=JSON.parse(fs.readFileSync(`${DIR}/${base}.source.json`,"utf8"));
  const chart={title:j.title,meta:"2020年",source:"家計調査・生産農業所得統計",xLabel:j.xLabel,yLabel:j.yLabel,points:j.points,labelNames:LABELS[m],level:"prefecture" as const,excludedCount:s.excludedAreas?.length??0};
  for(const [suffix,theme] of [["",CHART_THEMES.light],["-dark",CHART_THEMES.dark]] as const){
    fs.writeFileSync(`${DIR}/${base}${suffix}.svg`,renderRelationshipScatterChart(chart,theme),"utf8");
  }
  console.log(m,"ok",j.points.length);
}
