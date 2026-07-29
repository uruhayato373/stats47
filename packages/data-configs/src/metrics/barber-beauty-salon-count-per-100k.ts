import type { MetricConfig } from "../types";

export const barberBeautySalonCountPer100k: MetricConfig = {
  "key": "barber-beauty-salon-count-per-100k",
  "title": "理容・美容所数",
  "subtitle": "人口10万人当たり",
  "unit": "所",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H06117",
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
    "decimalPlaces": 1,
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
  "groupKey": "barber-beauty-salon-count",
  "seoTitle": "理容・美容所数ランキング都道府県【2023年】｜1位秋田県（561.4所）",
  "seoDescription": "2023年の理容・美容所数の都道府県別ランキング。1位秋田県（561.4所）、最下位神奈川県（188.7所）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
