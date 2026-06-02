import type { MetricConfig } from "../types";

export const windPowerTurbineCount: MetricConfig = {
  "key": "wind-power-turbine-count",
  "title": "風力発電導入量（設置基数）",
  "subtitle": "風車台数",
  "unit": "基",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2017,
    "to": 2017,
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
        "unit": "基/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "基/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "基/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "風力発電導入量（設置基数）ランキング都道府県【2017年】｜1位北海道（304基）",
  "seoDescription": "2017年の風力発電導入量（設置基数）の都道府県別ランキング。1位北海道（304基）、最下位香川県（0基）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
