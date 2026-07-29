import type { MetricConfig } from "../types";

export const otherConstructionConsumptionExpenditure: MetricConfig = {
  "key": "other-construction-consumption-expenditure",
  "title": "他の工事費消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間他の工事費消費支出額",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "020220050",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "他の工事費消費支出額ランキング都道府県【2024年】｜1位鳥取県（119,277円）",
  "seoDescription": "2024年の他の工事費消費支出額の都道府県別ランキング。1位鳥取県（119,277円）、最下位大分県（602円）で198.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
