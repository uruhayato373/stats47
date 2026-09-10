import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { parseArgs } from 'node:util';
const require=createRequire(import.meta.url),Excel=require('exceljs'),JSZip=require('jszip');
const prefectures=require('../../../packages/area/src/data/prefectures.json');
const { METRICS_REGISTRY }=require('../../../packages/data-configs/src/registry.ts');
const { buildRecipe }=require('../../../packages/data-configs/src/recipe.ts');
const { parseStatsValuesPayload }=require('../../../packages/stats-r2/src/schemas.ts');
const { extractYearCode }=require('../../../packages/estat-api/src/stats-data/utils/extract-year-code.ts');
const root=resolve(dirname(fileURLToPath(import.meta.url)),'../../..'),sha=b=>createHash('sha256').update(b).digest('hex');
const SOURCES = [
  {
    "group": "singleparent-income",
    "file": "singleparent-income-data.json",
    "kind": "api",
    "parameters": {
      "statsDataId": "0004008606",
      "cdTab": "003-2022",
      "cdCat01": "0,1,2,3,4,5,6",
      "limit": "100000"
    },
    "sha256": "d4045aab868449947189b9590a380ca896fb97311c840265fddf139681a8dfc4",
    "statisticalDataSha256": "79a780542552cbd07c9c28b4076c79d9bbcd03ba589250627a305cc7903ff74e",
    "bytes": 110836,
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  {
    "group": "singlemother-employment",
    "file": "singlemother-employment-data.json",
    "kind": "api",
    "parameters": {
      "statsDataId": "0003450603",
      "cdTab": "2020_16",
      "cdCat01": "1",
      "cdCat02": "00",
      "cdCat03": "0,11,12,2,3",
      "limit": "100000"
    },
    "sha256": "53147c143c570117a7499ac7d858c5dbf1353bd01becb151cd3cbf82456658ee",
    "statisticalDataSha256": "a70bd93d0c3207d87f8d92e8447164db96cc14901a07da50426960344cc86511",
    "bytes": 76387,
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450603"
  },
  {
    "group": "singlefather-employment",
    "file": "singlefather-employment-data.json",
    "kind": "api",
    "parameters": {
      "statsDataId": "0003450643",
      "cdTab": "2020_16",
      "cdCat01": "1",
      "cdCat02": "00",
      "cdCat03": "0,11,12,2,3",
      "limit": "100000"
    },
    "sha256": "63b6d6cfc94795129844b2474878282ae3c7c2351dbd914a0ea303b4e1de17b5",
    "statisticalDataSha256": "c1466fd30fe67697496a7ebf81c12c023fa1752cf4d00854cbf5e9f0dd06abd4",
    "bytes": 75868,
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450643"
  },
  {
    "group": "welfare",
    "file": "welfare-data.json",
    "kind": "api",
    "parameters": {
      "statsDataId": "0000010110",
      "cdCat01": "J110201,J1401",
      "limit": "100000"
    },
    "sha256": "b0c79888fc3d826618d48155247e5d77327b790c4ab589f1ad5e75b131ba5ffa",
    "statisticalDataSha256": "e6d584f24e53dfe39c4a96992a66fb4219e042e1ff8366c314780ccce95c9d03",
    "bytes": 493076,
    "url": "https://www.e-stat.go.jp/dbview?sid=0000010110"
  },
  {
    "group": "nutrition",
    "file": "nutrition2024.pdf",
    "kind": "file",
    "url": "https://www.mhlw.go.jp/content/001675215.pdf",
    "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
    "bytes": 488504
  },
  {
    "group": "ndb",
    "file": "ndb11-questionnaire.zip",
    "kind": "file",
    "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip",
    "sha256": "95efcf4dc8500954960547e78f195216297d2255aff7d89b401c2f321b0fff69",
    "bytes": 3148349
  }
];
const EXPECTED_SOURCES = {
  "single-mother-households-income-under100": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "1",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-households-income-100to199": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "2",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-households-income-200to299": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "3",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-households-income-300to399": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "4",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-households-income-400to499": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "5",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-households-income-500plus": {
    "kind": "estat",
    "statsDataId": "0004008606",
    "cdTab": "003-2022",
    "cdCat01": "6",
    "displayName": "総務省「令和4年就業構造基本調査」地域編 第15300表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004008606"
  },
  "single-mother-employment-rate": {
    "kind": "estat",
    "statsDataId": "0003450603",
    "cdTab": "2020_16",
    "cdCat01": "1",
    "cdCat02": "00",
    "axisRatio": {
      "axis": "cat03",
      "numeratorCodes": [
        "11"
      ],
      "denominatorCodes": [
        "11",
        "12",
        "2"
      ]
    },
    "displayName": "総務省「令和2年国勢調査」就業状態等基本集計 第31-3表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450603"
  },
  "single-father-employment-rate": {
    "kind": "estat",
    "statsDataId": "0003450643",
    "cdTab": "2020_16",
    "cdCat01": "1",
    "cdCat02": "00",
    "axisRatio": {
      "axis": "cat03",
      "numeratorCodes": [
        "11"
      ],
      "denominatorCodes": [
        "11",
        "12",
        "2"
      ]
    },
    "displayName": "総務省「令和2年国勢調査」就業状態等基本集計 第34-3表",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003450643"
  },
  "single-mother-public-assistance-households": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdTab": "00001",
    "cdCat01": "J110201",
    "displayName": "社会・人口統計体系（原典：被保護者調査）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/J"
  },
  "child-rearing-allowance-recipients": {
    "kind": "estat",
    "statsDataId": "0000010110",
    "cdTab": "00001",
    "cdCat01": "J1401",
    "displayName": "社会・人口統計体系（原典：福祉行政報告例）",
    "url": "https://www.e-stat.go.jp/koumoku/koumoku_teigi/J"
  },
  "vegetable-intake-male-age-adjusted": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "table": "第67表 野菜摂取量の平均値（20歳以上、性・都道府県別、年齢調整値）",
        "pdfPage": 3,
        "valueColumn": "男性の平均値・人数・95%信頼区間",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-09-10",
        "extraction": "PDFのSHAを固定し、47県＋全国の男女別人数・平均・CI上下限を抽出。年齢調整59歳を確認。CI/nはapp/themes/health-checkups/nutrition.jsonへ保持。",
        "verification": "47県欠測なし、CI下限<=平均<=上限、人数県合計=全国男性7225・女性8491。調整平均は県単純平均から作らない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      }
    }
  },
  "vegetable-intake-female-age-adjusted": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "table": "第67表 野菜摂取量の平均値（20歳以上、性・都道府県別、年齢調整値）",
        "pdfPage": 3,
        "valueColumn": "女性の平均値・人数・95%信頼区間",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-09-10",
        "extraction": "PDFのSHAを固定し、47県＋全国の男女別人数・平均・CI上下限を抽出。年齢調整59歳を確認。CI/nはapp/themes/health-checkups/nutrition.jsonへ保持。",
        "verification": "47県欠測なし、CI下限<=平均<=上限、人数県合計=全国男性7225・女性8491。調整平均は県単純平均から作らない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      }
    }
  },
  "salt-intake-male-age-adjusted": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "table": "第68表 食塩摂取量の平均値（20歳以上、性・都道府県別、年齢調整値）",
        "pdfPage": 4,
        "valueColumn": "男性の平均値・人数・95%信頼区間",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-09-10",
        "extraction": "PDFのSHAを固定し、47県＋全国の男女別人数・平均・CI上下限を抽出。年齢調整59歳を確認。CI/nはapp/themes/health-checkups/nutrition.jsonへ保持。",
        "verification": "47県欠測なし、CI下限<=平均<=上限、人数県合計=全国男性7225・女性8491。調整平均は県単純平均から作らない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      }
    }
  },
  "salt-intake-female-age-adjusted": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「令和6年国民健康・栄養調査報告」第4部",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/kenkou_iryou/kenkou/eiyou/r6-houkoku_00001.html",
    "config": {
      "source": {
        "name": "令和6年国民健康・栄養調査報告",
        "url": "https://www.mhlw.go.jp/content/001675215.pdf"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/001675215.pdf",
        "sha256": "ff87172adb1246c45e90cac29f24068d7f9fc59f1528138d2c5697e02126cbd1",
        "table": "第68表 食塩摂取量の平均値（20歳以上、性・都道府県別、年齢調整値）",
        "pdfPage": 4,
        "valueColumn": "女性の平均値・人数・95%信頼区間",
        "dataYear": "2024年10〜11月調査",
        "accessedAt": "2026-09-10",
        "extraction": "PDFのSHAを固定し、47県＋全国の男女別人数・平均・CI上下限を抽出。年齢調整59歳を確認。CI/nはapp/themes/health-checkups/nutrition.jsonへ保持。",
        "verification": "47県欠測なし、CI下限<=平均<=上限、人数県合計=全国男性7225・女性8491。調整平均は県単純平均から作らない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      }
    }
  },
  "health-checkup-late-dinner-rate": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「第11回NDBオープンデータ」特定健診質問票",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00017.html",
    "config": {
      "source": {
        "name": "第11回NDBオープンデータ 特定健診質問票",
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip",
        "sha256": "95efcf4dc8500954960547e78f195216297d2255aff7d89b401c2f321b0fff69",
        "table": "08_特定健診_問診項目/標準的な質問票（質問項目１５）　都道府県別性年齢階級別分布.xlsx",
        "valueColumn": "質問項目シート C:I=男性7年齢、J=男性中計、K:Q=女性7年齢、R=女性中計。各県はい/いいえ行。",
        "dataYear": "2023年度特定健診",
        "accessedAt": "2026-09-10",
        "extraction": "ZIPと指定XLSXのSHA固定。47県の男女中計のはい÷（はい＋いいえ）×100。年齢7階級合計と中計を照合、秘匿記号は0化せず停止。県判別不可を別記録。",
        "verification": "47県の回答数・男女中計・7年齢合計一致、分母正、0<=割合<=100。全国公式行なし、県判別不可を全国又は県へ混ぜない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      },
      "archiveMember": "08_特定健診_問診項目/標準的な質問票（質問項目１５）　都道府県別性年齢階級別分布.xlsx",
      "memberSha256": "196930ec6f68845b04688423a8caa7001f5626859d0ce2464a0b12d6c16cad8d"
    }
  },
  "health-checkup-breakfast-skipping-rate": {
    "kind": "external",
    "fetcherKey": "manual",
    "displayName": "厚生労働省「第11回NDBオープンデータ」特定健診質問票",
    "url": "https://www.mhlw.go.jp/stf/seisakunitsuite/bunya/0000177221_00017.html",
    "config": {
      "source": {
        "name": "第11回NDBオープンデータ 特定健診質問票",
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip"
      },
      "provenance": {
        "url": "https://www.mhlw.go.jp/content/12400000/001711941.zip",
        "sha256": "95efcf4dc8500954960547e78f195216297d2255aff7d89b401c2f321b0fff69",
        "table": "08_特定健診_問診項目/標準的な質問票（質問項目１７）　都道府県別性年齢階級別分布.xlsx",
        "valueColumn": "質問項目シート C:I=男性7年齢、J=男性中計、K:Q=女性7年齢、R=女性中計。各県はい/いいえ行。",
        "dataYear": "2023年度特定健診",
        "accessedAt": "2026-09-10",
        "extraction": "ZIPと指定XLSXのSHA固定。47県の男女中計のはい÷（はい＋いいえ）×100。年齢7階級合計と中計を照合、秘匿記号は0化せず停止。県判別不可を別記録。",
        "verification": "47県の回答数・男女中計・7年齢合計一致、分母正、0<=割合<=100。全国公式行なし、県判別不可を全国又は県へ混ぜない。",
        "restore": "node --import tsx .claude/scripts/themes/ingest-singleparent-nutrition.mjs --write-local"
      },
      "archiveMember": "08_特定健診_問診項目/標準的な質問票（質問項目１７）　都道府県別性年齢階級別分布.xlsx",
      "memberSha256": "5285d61ef10c30b25949d5042c4a3928f0242427d634aa25f0f21a2475b3451b"
    }
  }
};
const NUTRITION_NOTES = [
  "20歳以上の男女別、2024年10〜11月の栄養摂取状況調査。年齢は11月1日現在、日曜・祝日を除く任意の1日の摂取量。男女とも59歳の平均年齢へ調整した推定平均。",
  "人数は第67・68表の男女別集計人数で、全調査実施者数や年齢調整後の推計人口ではない。両指標の人数は同じ。",
  "標本調査のため95%信頼区間を併記する。県の順位差を有意差と解釈しない。全国値は同表の公式全国行で、県平均から再計算しない。",
  "調査地区は通常1道府県10地区、東京都15地区、石川県8地区（能登半島地震の影響）。",
  "世帯主が外国人の世帯、3食とも集団給食の世帯、賄い付き寮等の単独世帯などは調査対象外。施設入所者・長期入院者など世帯不在者や通常の食事をしない者等も対象外。",
  "NDBの40〜74歳健診受診者の食習慣割合とは母集団と調整方法が異なる。"
];
const areas=['00000',...prefectures.map(p=>p.prefCode)], names=new Map(prefectures.map(p=>[p.prefName,p.prefCode]));
const arr=v=>Array.isArray(v)?v:[v];
export function apiIndex(data,group){
 const source=SOURCES.find(s=>s.group===group);assert.equal(data.TABLE_INF['@id'],source.parameters.statsDataId);
 assert.equal(Number(data.RESULT_INF.TOTAL_NUMBER),arr(data.DATA_INF.VALUE).length,'partial API response');
 const classes=new Map(arr(data.CLASS_INF.CLASS_OBJ).map(c=>[c['@id'],new Map(arr(c.CLASS).map(v=>[v['@code'],v['@name']]))]));
 for(const p of prefectures)assert.equal(classes.get('area')?.get(p.prefCode),p.prefName,'prefecture name mismatch');
 if(group==='singleparent-income'){assert.match(data.TABLE_INF.TITLE.$,/母子世帯/);assert.equal(classes.get('cat01').get('1'),'100万円未満');assert.equal(classes.get('cat01').get('6'),'500万円以上');}
 if(group.includes('-employment')){assert.equal(classes.get('cat01').get('1'),group.startsWith('singlemother')?'母子世帯':'父子世帯');assert.equal(classes.get('cat03').get('11'),'就業者');assert.equal(classes.get('cat03').get('3'),'労働力状態「不詳」');}
 const index=new Map();
 for(const r of arr(data.DATA_INF.VALUE)){
  if(!areas.includes(r['@area']))continue;
  if(group==='welfare'&&extractYearCode(r['@time'])!=='2023')continue;
  assert.equal(extractYearCode(r['@time']),group==='welfare'?'2023':group==='singleparent-income'?'2022':'2020');
  const code=group.includes('-employment')?r['@cat03']:r['@cat01'];
  if(group.includes('-employment')){assert.equal(r['@cat01'],'1');assert.equal(r['@cat02'],'00');assert.equal(r['@tab'],'2020_16');}
  const unit=code==='J1401'?'人':'世帯';assert.equal(r['@unit'],unit);
  const coord=[r['@area'],code].join('|');assert.ok(!index.has(coord),'duplicate source coordinate');
  // Census/count '-' is a structural zero. Income's required 47-prefecture cells must be numeric.
  assert.ok(/^\d+$/.test(r.$)||(r.$==='-'&&group.includes('-employment')),'missing/suppressed count');
  const value=r.$==='-'?0:Number(r.$);assert.ok(Number.isSafeInteger(value));index.set(coord,value);
 }
 const get=(area,code)=>{const v=index.get([area,code].join('|'));assert.notEqual(v,undefined,'missing required source coordinate');return v;};
 let checks;
 if(group==='singleparent-income'){
  const reconciliation=[];
  for(const code of ['0','1','2','3','4','5','6']){for(const a of areas)assert.equal(get(a,code)%100,0,'observed publishing quantum changed');const sum47=areas.slice(1).reduce((s,a)=>s+get(a,code),0),national=get('00000',code),delta=sum47-national;assert.ok(Math.abs(delta)<=2400,'prefecture/national rounding bound');reconciliation.push({code,national,sum47,delta,roundingBound:2400});}
  const residuals=areas.map(a=>{const total=get(a,'0'),knownClassesTotal=['1','2','3','4','5','6'].reduce((s,c)=>s+get(a,c),0),difference=total-knownClassesTotal;assert.ok(difference>=-350,'class sums exceed rounding bound');return {areaCode:a,total,knownClassesTotal,difference,interpretation:'Not an exact unknown-income count: includes rounding and unclassified/unknown responses.'};});
  checks={reconciliation,residuals,missingPrefectureCells:0,publishingQuantumObserved:100};
 }else{
  const codes=group==='welfare'?['J110201','J1401']:['0','11','12','2','3'];
  const national=Object.fromEntries(codes.map(c=>{const sum47=areas.slice(1).reduce((s,a)=>s+get(a,c),0);assert.equal(sum47,get('00000',c),'national sum');return[c,sum47];}));
  if(group.includes('-employment'))for(const a of areas){assert.equal(get(a,'0'),['11','12','2','3'].reduce((s,c)=>s+get(a,c),0),'labour-state partition');assert.ok(get(a,'0')-get(a,'3')>0);}
  checks={national,partitionCount:group==='welfare'?0:48,missingPrefectureCells:0};
 }
 return {get,checks};
}
export function extractApi(data,config,group,verified){
 const {get}=verified||apiIndex(data,group),s=config.source;
 const expected=EXPECTED_SOURCES[config.key];assert.ok(expected);assert.deepEqual(s,expected,'metric source selection drift');
 const valueFor=a=>group.includes('-employment')?get(a,'11')/['11','12','2'].reduce((v,c)=>v+get(a,c),0)*100:get(a,s.cdCat01);
 const rows=prefectures.map(p=>({areaCode:p.prefCode,areaName:p.prefName,value:valueFor(p.prefCode)}));
 for(const r of rows)assert.ok(Number.isFinite(r.value)&&r.value>=0&&(!group.includes('-employment')||r.value<=100));
 return {rows,national:valueFor('00000')};
}
export function extractNutrition(text){
 const all=[],national=[],checks=[];
 for(const[table,kind,label,page]of[[67,'vegetable','野菜',3],[68,'salt','食塩',4]]){
  const part=text.split('\f').find(x=>new RegExp('第\\s*'+table+'\\s*表').test(x));assert.ok(part,'nutrition table missing');
  assert.match(part,/20\s*歳以上/);assert.match(part,/男女とも\s*59\s*歳/);assert.match(part,/95%\s*信頼区間/);
  const seen=new Set();
  for(const line of part.split('\n')){
   const tokens=line.trim().split(/\s+/),name=tokens.shift();if(name!=='全国'&&!names.has(name))continue;
   assert.equal(tokens.length,8,'nutrition column drift');assert.ok(!seen.has(name),'duplicate nutrition prefecture');seen.add(name);
   const nums=tokens.map(x=>{assert.match(x,/^\d[\d,]*(?:\.\d+)?$/);return Number(x.replaceAll(',',''));});
   for(const[sex,start]of[['male',0],['female',4]]){const[sampleSize,mean,lower95,upper95]=nums.slice(start,start+4);assert.ok(Number.isSafeInteger(sampleSize)&&sampleSize>0);assert.ok(lower95<=mean&&mean<=upper95&&lower95>=0,'invalid confidence interval');const row={areaCode:name==='全国'?'00000':names.get(name),areaName:name,metricKey:kind+'-intake-'+sex+'-age-adjusted',mean,lower95,upper95,sampleSize,period:'2024',ageAdjustment:'20歳以上・男女とも59歳に調整',source:{title:'令和6年国民健康・栄養調査 第'+table+'表 '+label+'摂取量',url:SOURCES.find(s=>s.group==='nutrition').url,sha256:SOURCES.find(s=>s.group==='nutrition').sha256,table:'第'+table+'表',pdfPage:page}};(name==='全国'?national:all).push(row);}
  }
  assert.equal(seen.size,48);
  for(const sex of ['male','female']){const key=kind+'-intake-'+sex+'-age-adjusted',rows=all.filter(r=>r.metricKey===key),n=national.find(r=>r.metricKey===key);assert.equal(rows.length,47);assert.equal(rows.reduce((s,r)=>s+r.sampleSize,0),n.sampleSize,'nutrition sample total');assert.equal(n.sampleSize,sex==='male'?7225:8491);checks.push({metricKey:key,sampleTotal:n.sampleSize,confidenceIntervals:47,nationalMean:n.mean,nationalMeanMethod:'official table row; not recomputed from prefecture means'});}
 }
 assert.equal(all.length,188);assert.equal(national.length,4);
 for(const r of all.filter(r=>r.metricKey.startsWith('vegetable'))){const other=all.find(x=>x.areaCode===r.areaCode&&x.metricKey===r.metricKey.replace('vegetable','salt'));assert.equal(r.sampleSize,other.sampleSize);}
 return {schemaVersion:1,rows:all,national,notes:NUTRITION_NOTES,checks};
}
export function extractNdb(workbook,question){
 const sheet=workbook.getWorksheet('質問項目');assert.ok(sheet);assert.match(String(sheet.getCell('A1').value),new RegExp('質問項目'+(question===15?'１５':'１７')));assert.match(String(sheet.getCell('A1').value),/2023年度/);
 assert.match(String(sheet.getCell('A1').value),question===15?/就寝前の2時間以内.*週に3回以上/:/朝食を抜く.*週に3回以上/);
 assert.equal(sheet.getCell('C4').value,'40～44歳');assert.equal(sheet.getCell('I4').value,'70～74歳');assert.equal(sheet.getCell('K4').value,'40～44歳');assert.equal(sheet.getCell('Q4').value,'70～74歳');assert.equal(sheet.getCell('J4').value,'中計');assert.equal(sheet.getCell('R4').value,'中計');
 const expected=[...prefectures.map(p=>p.prefName),'都道府県判別不可'],observations=[];
 for(let i=0;i<48;i++){
  const yesRow=6+i*2,noRow=yesRow+1,name=expected[i];for(const[r,answer]of[[yesRow,'はい'],[noRow,'いいえ']]){assert.equal(sheet.getCell(r,1).value,name,'NDB geographic row drift');assert.equal(sheet.getCell(r,2).value,answer);}
  const bySex={};
  for(const[sex,start,total]of[['male',3,10],['female',11,18]]){
   const counts={};for(const[r,answer]of[[yesRow,'yes'],[noRow,'no']]){const values=Array.from({length:7},(_,j)=>sheet.getCell(r,start+j).value),subtotal=sheet.getCell(r,total).value;for(const v of [...values,subtotal])assert.ok(typeof v==='number'&&Number.isSafeInteger(v)&&v>=10,'NDB suppressed or invalid count');assert.equal(values.reduce((a,b)=>a+b,0),subtotal,'NDB age subtotal');counts[answer]=subtotal;counts[answer+'ByAge']=values;}
   bySex[sex]=counts;
  }
  const yes=bySex.male.yes+bySex.female.yes,no=bySex.male.no+bySex.female.no,denominator=yes+no;assert.ok(denominator>0);observations.push({areaCode:i<47?prefectures[i].prefCode:null,areaName:name,yes,no,denominator,value:yes/denominator*100,bySex,sourceRows:[yesRow,noRow]});
 }
 return {question,rows:observations.slice(0,47),unknownGeography:observations[47],checks:{prefectures:47,ageSubtotalChecks:192,suppressedCells:0,nationalAvailable:false},national:null};
}
async function load(source,directory){
 const path=resolve(directory,source.file);let bytes;
 try{bytes=await readFile(path);}catch(e){if(e.code!=='ENOENT')throw e;let url=source.url;if(source.kind==='api'){const appId=process.env.NEXT_PUBLIC_ESTAT_APP_ID||process.env.ESTAT_APP_ID;assert.ok(appId,'e-Stat app ID required for uncached source');const u=new URL('https://api.e-stat.go.jp/rest/3.0/app/json/getStatsData');u.search=new URLSearchParams({appId,lang:'J',...source.parameters}).toString();url=u;}let r;try{r=await fetch(url,{signal:AbortSignal.timeout(60000)});}catch{throw Error('Source GET failed: '+source.group);}assert.ok(r.ok,'Source HTTP '+r.status);bytes=Buffer.from(await r.arrayBuffer());}
 if(source.kind==='api'){const raw=JSON.parse(bytes);assert.equal(Number(raw.GET_STATS_DATA?.RESULT?.STATUS),0);assert.equal(sha(JSON.stringify(raw.GET_STATS_DATA.STATISTICAL_DATA)),source.statisticalDataSha256,'API data or metadata changed');}else assert.equal(sha(bytes),source.sha256,'Official file changed');
 await mkdir(directory,{recursive:true});await writeFile(path,bytes);return {bytes,path,actualResponseSha256:sha(bytes)};
}
async function main(){
 const {values:o}=parseArgs({options:{'write-local':{type:'boolean',default:false},'source-dir':{type:'string',default:'/tmp/stats47-singleparent-nutrition-source'},out:{type:'string',default:'.local/verification/themes/singleparent-nutrition-source.json'}}});
 const sourceDir=resolve(o['source-dir']),loaded=new Map(),extracts=new Map(),files=[],generatedAt=new Date().toISOString(),report={status:'PASS',generatedAt,localStaged:o['write-local'],series:[],sourceChecks:{}};
 for(const s of SOURCES){const item=await load(s,sourceDir);loaded.set(s.group,item);if(s.kind==='api'){const data=JSON.parse(item.bytes).GET_STATS_DATA.STATISTICAL_DATA,verified=apiIndex(data,s.group);extracts.set(s.group,{data,verified});report.sourceChecks[s.group]=verified.checks;}}
 const nut=extractNutrition(execFileSync('pdftotext',['-layout',loaded.get('nutrition').path,'-'],{encoding:'utf8',maxBuffer:4*1024*1024}));report.sourceChecks.nutrition=nut.checks;
 const zip=await JSZip.loadAsync(loaded.get('ndb').bytes),ndb=new Map();
 for(const question of [15,17]){const key=question===15?'health-checkup-late-dinner-rate':'health-checkup-breakfast-skipping-rate',config=METRICS_REGISTRY[key];assert.ok(config?.isActive,'Register reviewed config first: '+key);assert.deepEqual(config.source,EXPECTED_SOURCES[key]);const member=config.source.config.archiveMember,bytes=await zip.file(member)?.async('nodebuffer');assert.ok(bytes,'NDB archive member missing');assert.equal(sha(bytes),config.source.config.memberSha256);const w=new Excel.Workbook();await w.xlsx.load(bytes);const extracted=extractNdb(w,question);ndb.set(question,extracted);report.sourceChecks['ndb'+question]=extracted;}
 for(const[key,expectedSource]of Object.entries(EXPECTED_SOURCES)){
  const config=METRICS_REGISTRY[key];assert.ok(config?.isActive,'Register reviewed config first: '+key);assert.deepEqual(config.source,expectedSource,'Config source drift');let rows,national,group;
  if(config.source.kind==='estat'){group=SOURCES.find(s=>s.kind==='api'&&s.parameters.statsDataId===config.source.statsDataId).group;const {data,verified}=extracts.get(group);({rows,national}=extractApi(data,config,group,verified));}
  else if(key.includes('-intake-')){group='nutrition';rows=nut.rows.filter(r=>r.metricKey===key).map(r=>({areaCode:r.areaCode,areaName:r.areaName,value:r.mean}));national=nut.national.find(r=>r.metricKey===key).mean;}
  else{group='ndb';const v=ndb.get(key.includes('late-dinner')?15:17);rows=v.rows.map(({areaCode,areaName,value})=>({areaCode,areaName,value}));national=null;}
  assert.equal(rows.length,47);assert.equal(new Set(rows.map(r=>r.areaCode)).size,47);const expectedYear=group==='singleparent-income'?2022:group.includes('-employment')?2020:group==='nutrition'?2024:2023;assert.deepEqual(config.years,{from:expectedYear,to:expectedYear});assert.equal(config.unit,group==='nutrition'?'g/日':group==='ndb'||group.includes('-employment')?'％':key==='child-rearing-allowance-recipients'?'人':'世帯','Metric unit drift');assert.equal(config.yearFormat,group==='welfare'||group==='ndb'?'fiscal':'calendar','Metric year semantics drift');assert.equal(config.display.conversionFactor,1);assert.deepEqual(config.entities,['prefecture']);const yearName=group==='welfare'?(key==='child-rearing-allowance-recipients'?'2023年度末（2024年3月31日）':'2023年度平均'):group==='ndb'?'2023年度':group==='nutrition'?'2024年10〜11月':group==='singleparent-income'?'2022年10月調査（所得は2021年10月〜2022年9月）':'2020年10月1日現在';
  const payload=parseStatsValuesPayload({metricKey:key,entityKind:'prefecture',rows:rows.map(r=>({...r,unit:config.unit,yearCode:String(expectedYear),yearName})),meta:{generatedAt,rowCount:47,areaCount:47,yearRange:[String(expectedYear),String(expectedYear)],recipe:buildRecipe(config)}});const content=JSON.stringify(payload);files.push({key:`app/stats/${key}/values.json`,content,sha256:sha(content)});report.series.push({metricKey:key,year:expectedYear,unit:config.unit,national,rows});
 }
 const nutritionPayload={schemaVersion:1,generatedAt,rows:nut.rows,national:nut.national,notes:nut.notes};const content=JSON.stringify(nutritionPayload);files.push({key:'app/themes/health-checkups/nutrition.json',content,sha256:sha(content)});report.nutrition={r2Key:'app/themes/health-checkups/nutrition.json',payloadSha256:sha(content),rows:nut.rows.length,nationalRows:nut.national.length};report.sourceFiles=SOURCES.map(s=>({group:s.group,url:s.url,actualResponseSha256:loaded.get(s.group).actualResponseSha256,expectedDataSha256:s.statisticalDataSha256||s.sha256}));
 // Verify all source families and all canonical payloads before staging any local R2 file.
 if(o['write-local'])for(const f of files){const destination=resolve(root,'.local/r2',f.key);await mkdir(dirname(destination),{recursive:true});await writeFile(destination,f.content);}
 report.files=files.map(({content,...f})=>f);report.metrics=report.series.length;report.rows=report.series.length*47;
 await mkdir(dirname(resolve(o.out)),{recursive:true});await writeFile(resolve(o.out),JSON.stringify(report,null,2)+'\n');await writeFile(resolve(sourceDir,'nutrition-proposed-payload.json'),JSON.stringify(nutritionPayload,null,2)+'\n');console.log(JSON.stringify({status:report.status,metrics:report.metrics,rows:report.rows,localStaged:report.localStaged,out:o.out}));
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url))await main();
