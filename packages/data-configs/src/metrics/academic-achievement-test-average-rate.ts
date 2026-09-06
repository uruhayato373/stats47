import type { MetricConfig } from "../types";

export const academicAchievementTestAverageRate: MetricConfig = {
  "key": "academic-achievement-test-average-rate",
  "title": "全国学力テスト平均正答率",
  "subtitle": "公立小学校6年生の国語・算数と公立中学校3年生の国語・数学の平均正答率の単純平均",
  "note": "国立教育政策研究所が公表する都道府県別（公立）の教科別平均正答率から算出。理科は3年に1度の実施のため含めない",
  "description": "文部科学省・国立教育政策研究所『全国学力・学習状況調査』の都道府県別結果のうち、小学校（国語・算数）と中学校（国語・数学）の4教科の平均正答率（％）を単純平均した値。義務教育段階の学力水準を都道府県で比べる指標で、進学率とは別物。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国立教育政策研究所『令和7年度全国学力・学習状況調査』都道府県別 問題別調査結果",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "license": "文部科学省ウェブサイト利用規約（政府標準利用規約2.0・商用可・出典表示必須）",
      },
      "description": "都道府県別 factsheet の xlsx（小学校 <NN>p_25q.xlsx / 中学校 <NN>m_25qs.xlsx）の各教科シート「全体」行にある都道府県（公立）平均正答率(％)。4教科を単純平均",
      "provenance": {
        "publicationIndexUrl": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/01_hokkaido/01p_25q.xlsx",
        "table": "問題別調査結果［国語］［算数］（小学校）／［国語］［数学］（中学校）の「集計結果」表、分類=全体",
        "valueColumn": "平均正答率(％) の <都道府県名>（公立）列（隣の 全国（公立）列は検算に使う）",
        "dataYear": "令和7年度(2025)・2025年4月17日実施",
        "accessedAt": "2026-09-05",
        "extraction": "packages/data-configs/scripts/ingest-nier-achievement.ts --year 25 が 47県×2校種の xlsx を取得し、各教科シートの「全体」行から都道府県値を読み4教科を単純平均（jszip で sharedStrings と sheet XML を直接解析）",
        "verification": "94ファイルの「全国（公立）」列が教科ごとに全ファイルで一致することをスクリプトが検査（不一致なら fail）。2026-09-05 実行: 全国（公立）は小国66.8/小算58/中国54.3/中数48.3（単純平均56.85）、47県の上位は東京61・石川60.75・福井59.5、下位は沖縄50.5。都道府県値はNIER公表どおり整数",
        "restore": "npx tsx packages/data-configs/scripts/ingest-nier-achievement.ts --year 25 --refresh --dry-run で再取得し、47県の値と全国値の一致を突合",
      },
    },
    "displayName": "国立教育政策研究所「全国学力・学習状況調査」",
    "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2025,
    "to": 2025,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
