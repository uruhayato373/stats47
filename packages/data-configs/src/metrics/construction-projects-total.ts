import type { MetricConfig } from "../types";

export const constructionProjectsTotal: MetricConfig = {
  "key": "construction-projects-total",
  "title": "建設工事件数（合計）",
  "unit": "件",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0003458635",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "建設工事受注動態統計調査",
    "url": "https://www.mlit.go.jp/sogoseisaku/jouhouka/sosei_jouhouka_tk4_000002.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "建設工事件数（合計）ランキング都道府県【2023年】｜1位北海道（16,266件）",
  "seoDescription": "2023年の建設工事件数（合計）の都道府県別ランキング。1位北海道（16,266件）、最下位奈良県（1,258件）で12.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
