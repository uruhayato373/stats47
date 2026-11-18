import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roadTrafficCongestion: MetricConfig = {
  "key": "road-traffic-congestion",
  "title": "一般道路の混雑度",
  "subtitle": "一般道路計・令和3年度センサス",
  "unit": "比",
  "category": "infrastructure",
  "note": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の混雑度を用いる。交通量推定不能区間を含まない集計で、混雑度は交通量を道路の交通容量で割った比。2021年の調査値であり、現在の混雑状況ではない。既存の average-road-traffic-volume は社会・人口統計体系の平均交通量であり、本指標は容量に対する利用の度合いを表す。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "令和3年度 全国道路・街路交通情勢調査 一般交通量調査 集計表",
        "url": "https://www.mlit.go.jp/road/census/r3/",
        "license": "公共データ利用規約 (第1.0版) (PDL1.0) (国土交通省サイト) (https://www.mlit.go.jp/links/terms-of-use.html)。出典を明記しstats47が抽出・集計。"
      },
      "description": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の混雑度を用いる。交通量推定不能区間を含まない集計で、混雑度は交通量を道路の交通容量で割った比。2021年の調査値であり、現在の混雑状況ではない。既存の average-road-traffic-volume は社会・人口統計体系の平均交通量であり、本指標は容量に対する利用の度合いを表す。",
      "provenance": {
        "openData": {
          "datasetId": "mlit-road-census-r3",
          "version": "2023-06-30",
          "table": "road-congestion",
          "candidate": {
            "metricKey": "road-traffic-congestion",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.mlit.go.jp/road/census/r3/",
        "url": "https://www.mlit.go.jp/road/census/r3/data/csv/syuukei04.csv",
        "table": "road-congestion",
        "valueColumn": "混雑度",
        "dataYear": "令和3年度（2021年）",
        "accessedAt": "2026-11-17",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択47行・47県・値域0.39〜0.91比）と照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric road-traffic-congestion --write-local --out /tmp/road-traffic-congestion.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
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
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyId": "road-statistics",
  "isActive": true
};
