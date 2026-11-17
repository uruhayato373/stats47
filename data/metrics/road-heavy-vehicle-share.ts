import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roadHeavyVehicleShare: MetricConfig = {
  "key": "road-heavy-vehicle-share",
  "title": "一般道路の12時間大型車混入率",
  "subtitle": "一般道路計・12時間・令和3年度センサス",
  "unit": "％",
  "category": "infrastructure",
  "note": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の12時間大型車混入率を用いる。交通量推定不能区間を含まない集計で、12時間の自動車類交通量に占める大型車の割合。2021年の調査値であり、現在の値ではない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "令和3年度 全国道路・街路交通情勢調査 一般交通量調査 集計表",
        "url": "https://www.mlit.go.jp/road/census/r3/",
        "license": "公共データ利用規約 (第1.0版) (PDL1.0) (国土交通省サイト) (https://www.mlit.go.jp/links/terms-of-use.html)。出典を明記しstats47が抽出・集計。"
      },
      "description": "令和3年度（2021年）の全国道路・街路交通情勢調査（道路交通センサス）一般交通量調査の集計表から、一般道路計の12時間大型車混入率を用いる。交通量推定不能区間を含まない集計で、12時間の自動車類交通量に占める大型車の割合。2021年の調査値であり、現在の値ではない。",
      "provenance": {
        "openData": {
          "datasetId": "mlit-road-census-r3",
          "version": "2023-06-30",
          "table": "heavy-vehicle-share",
          "candidate": {
            "metricKey": "road-heavy-vehicle-share",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.mlit.go.jp/road/census/r3/",
        "url": "https://www.mlit.go.jp/road/census/r3/data/csv/syuukei04.csv",
        "table": "heavy-vehicle-share",
        "valueColumn": "１２時間大型車混入率（％）",
        "dataYear": "令和3年度（2021年）",
        "accessedAt": "2026-11-17",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択47行・47県・値域7.4〜19.6％）と照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric road-heavy-vehicle-share --write-local --out /tmp/road-heavy-vehicle-share.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
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
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyId": "road-statistics",
  "isActive": false
};
