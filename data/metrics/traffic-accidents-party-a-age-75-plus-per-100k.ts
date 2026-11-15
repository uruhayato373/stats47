import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const trafficAccidentsPartyAAge75PlusPer100k: MetricConfig = {
  "key": "traffic-accidents-party-a-age-75-plus-per-100k",
  "title": "第1当事者が75歳以上の交通事故発生件数",
  "subtitle": "総人口10万人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "note": "2025年の交通事故オープンデータ本票から、当事者A（第1当事者）の年齢が75歳以上の事故を集計する。第1当事者には歩行者も含む。2025年総人口で除して10万倍した値であり、75歳以上人口を分母にした事故率や高齢運転者の事故率ではない。",
  "source": {
    "kind": "external",
    "fetcherKey": "manual",
    "config": {
      "source": {
        "name": "交通事故統計情報のオープンデータ",
        "url": "https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html",
        "license": "公共データ利用規約 (第1.0版) (PDL1.0) (警察庁サイト) (https://www.npa.go.jp/rules/index.html)。出典を明記しstats47が抽出・集計。"
      },
      "description": "2025年の交通事故オープンデータ本票から、当事者A（第1当事者）の年齢が75歳以上の事故を集計する。第1当事者には歩行者も含む。2025年総人口で除して10万倍した値であり、75歳以上人口を分母にした事故率や高齢運転者の事故率ではない。",
      "provenance": {
        "openData": {
          "datasetId": "npa-traffic-accident-opendata",
          "version": "2025",
          "table": "accident-count-by-participants",
          "candidate": {
            "metricKey": "traffic-accidents-party-a-age-75-plus-per-100k",
            "channel": "prefecture-ranking"
          }
        },
        "publicationIndexUrl": "https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html",
        "url": "https://www.npa.go.jp/publications/statistics/koutsuu/opendata/2025/honhyo_2025.csv",
        "table": "accident-count-by-participants",
        "valueColumn": "正規化表の value（本票は行数を集計）",
        "dataYear": "2025年",
        "accessedAt": "2026-11-15",
        "extraction": "非公開R2の原本manifestと全原本をSHA-256照合して復元し、fetch recipeで正規化。展開の台帳 open-data.expansion の該当候補のslice・aggregation・denominatorTimeで47県を集計。stats47による加工。",
        "verification": "台帳のverification（表SHA-256・選択2292行・47県・値域14.310997047164276〜51.28798767802076件/10万人）と照合。分母の公開R2観測値もSHA-256と2025年の地域・単位を照合。",
        "restore": "node .claude/scripts/open-data/ingest-metric.mjs --metric traffic-accidents-party-a-age-75-plus-per-100k --write-local --out /tmp/traffic-accidents-party-a-age-75-plus-per-100k.json（CIは非公開R2から復元。手元の原本を使う場合は --local-source を追加）"
      }
    },
    "displayName": "交通事故統計情報のオープンデータ",
    "url": "https://www.npa.go.jp/publications/statistics/koutsuu/opendata/index_opendata.html"
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
  "surveyId": "traffic-accident-statistics",
  "isActive": false
};
