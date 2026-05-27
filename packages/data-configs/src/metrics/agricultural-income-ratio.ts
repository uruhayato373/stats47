import type { MetricConfig } from "../types";

export const agriculturalIncomeRatio: MetricConfig = {
  "key": "agricultural-income-ratio",
  "title": "農業所得割合",
  "unit": "％",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L0110101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2003,
    "to": 2003,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "農業所得割合ランキング都道府県【2003年】｜1位北海道（46％）",
  "seoDescription": "2003年の農業所得割合の都道府県別ランキング。1位北海道（46％）、最下位滋賀県（2.5％）で18.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
