import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nationalAssessmentJuniorHighFriendshipSatisfactionRate: MetricConfig = {
  "key": "national-assessment-junior-high-friendship-satisfaction-rate",
  "title": "友達関係に満足する中学生の割合",
  "subtitle": "公立中学校・3年生の肯定回答",
  "unit": "％",
  "category": "educationsports",
  "note": "令和7年度（2025年度）の全国学力・学習状況調査の公立中学校3年生への質問紙。設問「友達関係に満足していますか」の「当てはまる」「どちらかといえば、当てはまる」の公表割合を合計する。小数第1位で公表された回答割合の合計であり、人口を分母にしない。既存の academic-achievement-test-average-rate は小中4教科の平均正答率であり、本指標は生徒の回答を扱う。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "全国学力・学習状況調査 児童生徒質問紙 (生活習慣・都道府県別)",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "license": "文部科学省ウェブサイト利用規約 (政府標準利用規約2.0・CC BY 4.0 互換。NIER著作権ページが同規約に従う旨明記) (https://www.mext.go.jp/b_menu/1351168.htm)。出典を明記しstats47が抽出・集計。"
      },
      "description": "令和7年度（2025年度）の全国学力・学習状況調査の公立中学校3年生への質問紙。設問「友達関係に満足していますか」の「当てはまる」「どちらかといえば、当てはまる」の公表割合を合計する。小数第1位で公表された回答割合の合計であり、人口を分母にしない。既存の academic-achievement-test-average-rate は小中4教科の平均正答率であり、本指標は生徒の回答を扱う。",
      "provenance": {
        "openData": {
          "datasetId": "nier-gakuryoku-lifestyle",
          "version": "2025",
          "table": "junior-lifestyle-response-rates",
          "candidate": {
            "metricKey": "national-assessment-junior-high-friendship-satisfaction-rate",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/01_hokkaido/01m_25a.xlsx",
        "table": "junior-lifestyle-response-rates",
        "valueColumn": "rate",
        "dataYear": "令和7年度（2025年度・公立校）",
        "accessedAt": "2026-11-17",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択94行・47県・値域89.6〜93％）と照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric national-assessment-junior-high-friendship-satisfaction-rate --write-local --out /tmp/national-assessment-junior-high-friendship-satisfaction-rate.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
      }
    },
    "displayName": "全国学力・学習状況調査 児童生徒質問紙 (生活習慣・都道府県別)",
    "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolatePurples",
    "colorSchemeType": "sequential"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyId": "academic-achievement-survey",
  "isActive": true
};
