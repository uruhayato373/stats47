import type { MetricConfig } from "../types";

export const athleticsStadiumCountPublic: MetricConfig = {
  "key": "athletics-stadium-count-public",
  "title": "陸上競技場数",
  "subtitle": "公共スポーツ施設",
  "unit": "施設",
  "category": "educationsports",
  "note": "体育・スポーツ施設現況調査の『公共スポーツ施設』に計上された陸上競技場の箇所数(公立社会教育施設に付帯するスポーツ施設と社会体育施設の合計)。学校の体育施設・大学・高専・民間のスポーツ施設は含まない。調査は3年周期。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "スポーツ庁「体育・スポーツ施設現況調査」(平成30年度・令和3年度・令和6年度) 都道府県別・市区町村人口規模別・調査種別 設置箇所数 陸上競技場",
        "url": "https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm",
        "license": "スポーツ庁ホームページの利用規約(https://www.mext.go.jp/sports/b_menu/about_link.htm、文部科学省ウェブサイトの利用規約に従う)に基づき出典を明記して利用(e-Stat 政府統計コード00402101)",
      },
      "description": "陸上競技場の公共スポーツ施設の設置箇所数。体育・スポーツ施設現況調査の『都道府県別・市区町村人口規模別・調査種別 設置箇所数』陸上競技場シートの、公共スポーツ施設・計(公立社会教育施設に付帯するスポーツ施設+社会体育施設)の列。野球場は調査が『野球場・ソフトボール場』の合算でしか公表していないため、本指標の対象外(野球場・ソフトボール場は既存指標 baseball-field-public)。",
      "provenance": {
        "publicationIndexUrl": "https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm",
        "url": "https://www.e-stat.go.jp/stat-search/file-download?statInfId=000040451156&fileKind=0",
        "table": "都道府県別・市区町村人口規模別・調査種別 設置箇所数(表番号1-51)の陸上競技場シート。令和3年度は statInfId=000040052542、平成30年度は statInfId=000031942524",
        "valueColumn": "公共スポーツ施設 計(=公立社会教育施設に付帯するスポーツ施設+社会体育施設)",
        "dataYear": "令和6年度(2024年度)・令和3年度(2021年度)・平成30年度(2018年度)",
        "accessedAt": "2026-10-08",
        "extraction": "e-Stat のファイルダウンロードから3回分の xlsx を取得→『陸上競技場』シートのヘッダ(6〜7行目)で公共スポーツ施設の列を解決→47都道府県行を抽出('-'は0)。抽出スクリプト: .claude/scripts/data/fetch-sports-facility-athletics-stadium.mjs",
        "verification": "各回で47県の合計が『総数』行の公共計と一致(平成30年度988・令和3年度1,004・令和6年度1,044)、各県で公共計=公立社会教育施設付帯+社会体育施設",
        "restore": "node .claude/scripts/data/fetch-sports-facility-athletics-stadium.mjs で3回分の xlsx を再取得し同じ抽出・検算を再現できる",
      },
    },
    "displayName": "体育・スポーツ施設現況調査",
    "url": "https://www.mext.go.jp/sports/b_menu/toukei/chousa04/shisetsu/kekka/1368165.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2018,
      2021,
      2024,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "surveyId": "sports-facilities-survey",
  "seoTitle": "陸上競技場数ランキング都道府県【2024年度】｜1位北海道(90施設)",
  "seoDescription": "2024年度の陸上競技場(公共スポーツ施設)の設置箇所数を都道府県別に比較。1位北海道(90施設)、最下位徳島県(6施設)で15倍の差。体育・スポーツ施設現況調査から。地図とグラフで47都道府県を比較。",
  "isActive": true,
};
