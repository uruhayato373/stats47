import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nationalAssessmentElementaryJapaneseCorrectRate: MetricConfig = {
  "key": "national-assessment-elementary-japanese-correct-rate",
  "title": "小学生の国語平均正答率",
  "subtitle": "公立小学校・6年生",
  "unit": "％",
  "category": "educationsports",
  "note": "令和7年度（2025年度）の全国学力・学習状況調査における公立小学校6年生の国語の平均正答率。公表表の整数％を用いる。既存の academic-achievement-test-average-rate は小中4教科の単純平均であり、本指標は小学校国語のみを対象とする。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "全国学力・学習状況調査 教科正答率 (都道府県別)",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "license": "文部科学省ウェブサイト利用規約 (政府標準利用規約2.0・CC BY 4.0 互換。NIER著作権ページが同規約に従う旨明記) (https://www.mext.go.jp/b_menu/1351168.htm)。出典を明記しstats47が抽出・集計。"
      },
      "description": "令和7年度（2025年度）の全国学力・学習状況調査における公立小学校6年生の国語の平均正答率。公表表の整数％を用いる。既存の academic-achievement-test-average-rate は小中4教科の単純平均であり、本指標は小学校国語のみを対象とする。",
      "provenance": {
        "openData": {
          "datasetId": "nier-gakuryoku-achievement",
          "version": "2025",
          "table": "primary-achievement",
          "candidate": {
            "metricKey": "national-assessment-elementary-japanese-correct-rate",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/prefecture_city.html",
        "url": "https://www.nier.go.jp/25chousakekkahoukoku/factsheet/01_hokkaido/01p_25q.xlsx",
        "table": "primary-achievement",
        "valueColumn": "correctRate",
        "dataYear": "令和7年度（2025年度・公立校）",
        "accessedAt": "2026-11-17",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択47行・47県・値域64〜71％）と照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric national-assessment-elementary-japanese-correct-rate --write-local --out /tmp/national-assessment-elementary-japanese-correct-rate.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
      }
    },
    "displayName": "全国学力・学習状況調査 教科正答率 (都道府県別)",
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
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyId": "academic-achievement-survey",
  "isActive": true
};
