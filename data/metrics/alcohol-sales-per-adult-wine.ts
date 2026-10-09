import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const alcoholSalesPerAdultWine: MetricConfig = {
  "key": "alcohol-sales-per-adult-wine",
  "title": "成人1人あたり酒類販売(消費)数量",
  "subtitle": "果実酒(ワイン等)",
  "unit": "l",
  "category": "economy",
  "note": "国税庁の酒類販売(消費)数量(消費者に対する販売数量。4月〜翌年3月の年度)を、20歳未満を除く成人人口(総務省「人口推計」)で割った値。県内で販売された数量が分子のため、観光客や通勤者の購入も含まれうる。沖縄県は一次資料の表と全国平均に含まれないため46都道府県。沖縄国税事務所が別に公表する販売(消費)数量(令和5年度 124,533kL)から概算すると約108リットルで東京都を超えるが、国税庁は沖縄を全国比較の表から除いており、同一の表としての公表ではないため、この系列には混ぜない(2026-10-08確認)。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国税庁「酒のしおり」(令和7年7月版・令和6年6月版)「成人1人当たりの酒類販売(消費)数量表(都道府県別)」",
        "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2025/index.htm",
        "license": "公共データ利用規約(第1.0版)(権利表記のない国税庁ホームページのコンテンツ。https://www.nta.go.jp/chuijiko/copy.htm)。出典「国税庁ホームページ」を明記し、焼酎は連続式と単式を合算した旨・値を整理して掲載した旨を表示",
      },
      "description": "果実酒の都道府県別・成人1人あたり酒類販売(消費)数量(リットル)。国税庁「酒のしおり」の都道府県別表の表の「果実酒」列(甘味果実酒は含まない)。主として国税庁統計年報書(4月〜翌年3月)による販売(消費)数量を、成人人口(20歳未満を除く、総務省「人口推計」)で割った値。沖縄県は表に含まれない。",
      "provenance": {
        "publicationIndexUrl": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2025/index.htm",
        "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2025/excel/0014-3.xlsx",
        "table": "13 令和5年度成人1人当たりの酒類販売(消費)数量等表(2025年版 0014-3.xlsx)、令和4年度分は2024年版 https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2024/excel/0014-3.xlsx",
        "valueColumn": "表の「果実酒」列(甘味果実酒は含まない)",
        "dataYear": "令和4年度(2022年度)・令和5年度(2023年度)",
        "accessedAt": "2026-10-08",
        "extraction": "各版の index ページから excel/0014-3.xlsx の直リンクを解決して取得→シート「13 令和N年度成人1人当たり…」の都道府県行(46県)を読み、該当列を3桁に丸めて抽出(焼酎は連続式+単式)。抽出スクリプト: .claude/scripts/data/fetch-nta-alcohol-per-adult.mjs",
        "verification": "令和5年度は同ブックの販売数量(Kl)と成人人口(千人)から1人あたり量を再計算し、46県×15区分が公表値と一致(最大差0.00000l)、全国計(Kl)が46県の和と一致。令和4年度は量の元表がないため、各県の合計=14区分の和(最大差0.0104l)と全国平均が県の範囲内であることを確認",
        "restore": "node .claude/scripts/data/fetch-nta-alcohol-per-adult.mjs で xlsx を再取得し同じ抽出・検算を再現できる",
      },
    },
    "displayName": "国税庁",
    "url": "https://www.nta.go.jp/taxes/sake/shiori-gaikyo/shiori/2025/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2022,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyId": "nta-annual-statistics",
  "seoTitle": "成人1人あたりワイン(果実酒)の販売量、都道府県で差｜1位東京都7.9リットル【2023年度】",
  "seoDescription": "国税庁の酒類販売(消費)数量を成人人口で割り、ワイン(果実酒)の成人1人あたり販売量を都道府県別に比較。2023年度は1位東京都7.9リットル、最下位佐賀県1.4リットルで約5.6倍の差(沖縄県を除く46都道府県)。",
  "isActive": true,
};
