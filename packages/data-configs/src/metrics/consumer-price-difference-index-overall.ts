import type { MetricConfig } from "../types";

export const consumerPriceDifferenceIndexOverall: MetricConfig = {
  "key": "consumer-price-difference-index-overall",
  "title": "消費者物価地域差指数",
  "subtitle": "総合",
  "description": "全国平均の物価水準を100とし、総合の品目構成で都道府県の物価水準を比較した年平均指数です。",
  "note": "消費者物価指数（CPI）の総合に含まれる「持家の帰属家賃」は、この総合指数には含まれません。",
  "unit": "（全国=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04414",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2013,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消費者物価地域差指数ランキング都道府県【2024年】｜1位東京都（104‐）",
  "seoDescription": "2024年の消費者物価地域差指数の都道府県別ランキング。1位東京都（104‐）、最下位群馬県（96.2‐）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
