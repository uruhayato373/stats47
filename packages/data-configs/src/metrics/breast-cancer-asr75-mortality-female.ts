import type { MetricConfig } from "../types";

export const breastCancerAsr75MortalityFemale: MetricConfig = {
  "key": "breast-cancer-asr75-mortality-female",
  "title": "乳がん 75歳未満年齢調整死亡率",
  "subtitle": "女性・人口10万人対",
  "unit": "人/10万人",
  "category": "population",
  "note": "乳房(ICD-10 C50)による女性の75歳未満年齢調整死亡率。基準人口は1985年(昭和60年)日本人モデル人口。年ごとの死亡数が少ない県では1年の値が大きくぶれるため、単年の順位だけで県の優劣を読まない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "国立がん研究センター がん対策情報センター「がん情報サービス がん統計」(厚生労働省人口動態統計)",
        "url": "https://ganjoho.jp/reg_stat/statistics/data/dl/index.html",
        "license": "国立がん研究センター「がん情報サービス がん統計」の出典を明記して利用(出典明記を条件に利用可)",
      },
      "description": "女性の乳房の悪性新生物(ICD-10 C50)による75歳未満年齢調整死亡率(人口10万人対)の都道府県別・年別の値。死亡数は人口動態統計保管統計表、人口は国勢調査人口と総務省推計人口(いずれも総人口)、基準人口は1985年日本人モデル人口。ブック内シート asr75(部位コード02112・性別=女)。",
      "provenance": {
        "publicationIndexUrl": "https://ganjoho.jp/reg_stat/statistics/data/dl/index.html",
        "pdfUrl": "https://ganjoho.jp/reg_stat/statistics/data/dl/excel/pref_CancerSite_mortalityASR75(1995-2024).xls",
        "table": "都道府県別 部位別 75歳未満年齢調整死亡率 (1995-2024) シート asr75",
        "valueColumn": "部位コード02112(乳房)・性別=女の年別列(1995〜2024)",
        "dataYear": "1995〜2024年",
        "accessedAt": "2026-10-08",
        "extraction": "ダウンロードページから xls の直リンクを解決して取得→OLE2/BIFF8 を依存なしで読む(.claude/scripts/data/lib/read-xls.mjs)→シート asr75 の部位コード02112×性別=女の47都道府県を年別に抽出→小数第2位に丸め。抽出スクリプト: .claude/scripts/data/fetch-cancer-asr75-breast.mjs",
        "verification": "47県×30年に欠測なし/同ブックの順位表シート asr75rank と全年・47県の値と並びが一致(誤差1e-6)/全国値が各年の県別最小〜最大の範囲内かつ県単純平均との差10%以内",
        "restore": "node .claude/scripts/data/fetch-cancer-asr75-breast.mjs で xls を再取得し同じ抽出・検算を再現できる",
      },
    },
    "displayName": "国立がん研究センター がん情報サービス",
    "url": "https://ganjoho.jp/reg_stat/statistics/data/dl/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1995,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "surveyId": "age-adjusted-mortality-statistics",
  "seoTitle": "乳がん死亡率の都道府県ランキング｜1位北海道12.81 vs 最下位徳島県5.13(75歳未満・年齢調整)【2024年】",
  "seoDescription": "女性の乳がん75歳未満年齢調整死亡率(人口10万人対)を都道府県別に比較。2024年は1位北海道12.81、最下位徳島県5.13で約2.5倍の差。1995年からの推移を地図とグラフで確認。",
  "isActive": true,
};
