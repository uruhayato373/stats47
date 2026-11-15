import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const heatstrokeEmergencyTransportsPer100k: MetricConfig = {
  "key": "heatstroke-emergency-transports-per-100k",
  "title": "熱中症救急搬送人員",
  "subtitle": "総人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "note": "2025年5〜9月（5月1日〜9月30日の153日間）の救急搬送人員を合計し、2025年総人口で除して10万倍した値。搬送地に基づく集計であり、住民の発症率ではない。既存の heatstroke-emergency-transports は搬送人員の実数であり、本指標は人口当たりに換算している。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "熱中症による救急搬送人員（都道府県別）",
        "url": "https://www.fdma.go.jp/disaster/heatstroke/post4.html",
        "license": "公共データ利用規約（第1.0版） (https://www.fdma.go.jp/about/others/post3.html)。出典を明記しstats47が抽出・集計。"
      },
      "description": "2025年5〜9月（5月1日〜9月30日の153日間）の救急搬送人員を合計し、2025年総人口で除して10万倍した値。搬送地に基づく集計であり、住民の発症率ではない。既存の heatstroke-emergency-transports は搬送人員の実数であり、本指標は人口当たりに換算している。",
      "provenance": {
        "openData": {
          "datasetId": "fdma-heatstroke-emergency-transports",
          "version": "2025-10-29",
          "table": "heatstroke-transports-daily",
          "candidate": {
            "metricKey": "heatstroke-emergency-transports-per-100k",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.fdma.go.jp/disaster/heatstroke/post4.html",
        "url": "https://www.fdma.go.jp/disaster/heatstroke/items/heatstroke003_data_r7.xlsx",
        "table": "heatstroke-transports-daily",
        "valueColumn": "搬送人員（計）",
        "dataYear": "2025年",
        "accessedAt": "2026-11-15",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択7191行・47県・値域54.07920580574862〜128.3965390536376人/10万人）と照合。分母の公開R2観測値もSHA-256と2025年の地域・単位を照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric heatstroke-emergency-transports-per-100k --write-local --out /tmp/heatstroke-emergency-transports-per-100k.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
      }
    },
    "displayName": "熱中症による救急搬送人員（都道府県別）",
    "url": "https://www.fdma.go.jp/disaster/heatstroke/post4.html"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 2025,
    "to": 2025
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2
  },
  "calculation": {
    "isCalculated": false
  },
  "surveyScope": "not-applicable",
  "surveyScopeReason": "消防機関の熱中症救急搬送実績を集計した行政業務報告",
  "isActive": false
};
