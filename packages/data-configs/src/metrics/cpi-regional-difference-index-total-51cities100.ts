import type { MetricConfig } from "../types";

export const cpiRegionalDifferenceIndexTotal51cities100: MetricConfig = {
  "key": "cpi-regional-difference-index-total-51cities100",
  "title": "消費者物価地域差指数",
  "subtitle": "総合",
  "unit": "（51都市=100）",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L0420101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2013,
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
  "seoTitle": "消費者物価地域差指数ランキング都道府県【2013年】｜1位神奈川県（106‐）",
  "seoDescription": "2013年の消費者物価地域差指数の都道府県別ランキング。1位神奈川県（106‐）、最下位宮崎県（97.1‐）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
