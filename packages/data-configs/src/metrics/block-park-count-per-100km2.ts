import type { MetricConfig } from "../types";

export const blockParkCountPer100km2: MetricConfig = {
  "key": "block-park-count-per-100km2",
  "title": "街区公園数",
  "subtitle": "面積100km²当たり",
  "unit": "所",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H08302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "block-park-count",
  "seoTitle": "街区公園数ランキング都道府県【2023年】｜1位東京都（487.3所）",
  "seoDescription": "2023年の街区公園数の都道府県別ランキング。1位東京都（487.3所）、最下位佐賀県（11.09所）で43.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
