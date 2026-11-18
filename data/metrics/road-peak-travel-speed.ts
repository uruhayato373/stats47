import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roadPeakTravelSpeed: MetricConfig = {
  "key": "road-peak-travel-speed",
  "title": "一般道路の混雑時旅行速度",
  "subtitle": "一般道路計・朝夕・令和3年度センサス",
  "unit": "km/h",
  "category": "infrastructure",
  "note": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の混雑時旅行速度（朝夕の旅行速度）を用いる。2021年の調査値であり、現在の速度ではない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "令和3年度 全国道路・街路交通情勢調査 一般交通量調査 集計表",
        "url": "https://www.mlit.go.jp/road/census/r3/",
        "license": "公共データ利用規約 (第1.0版) (PDL1.0) (国土交通省サイト) (https://www.mlit.go.jp/links/terms-of-use.html)。出典を明記しstats47が抽出・集計。"
      },
      "description": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の混雑時旅行速度（朝夕の旅行速度）を用いる。2021年の調査値であり、現在の速度ではない。",
      "provenance": {
        "openData": {
          "datasetId": "mlit-road-census-r3",
          "version": "2023-06-30",
          "table": "peak-travel-speed",
          "candidate": {
            "metricKey": "road-peak-travel-speed",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.mlit.go.jp/road/census/r3/",
        "url": "https://www.mlit.go.jp/road/census/r3/data/csv/syuukei05.csv",
        "table": "peak-travel-speed",
        "valueColumn": "朝夕旅行速度（混雑時旅行速度）（ｋｍ／ｈ）／合計",
        "dataYear": "令和3年度（2021年）",
        "accessedAt": "2026-11-17",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択47行・47県・値域15.5〜46.1km/h）と照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric road-peak-travel-speed --write-local --out /tmp/road-peak-travel-speed.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
      }
    },
    "displayName": "令和3年度 全国道路・街路交通情勢調査 一般交通量調査 集計表",
    "url": "https://www.mlit.go.jp/road/census/r3/"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2021,
    "to": 2021
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyId": "road-statistics",
  "isActive": true
};
