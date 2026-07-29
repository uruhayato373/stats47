import type { MetricConfig } from "../types";

export const annualSalesAmount: MetricConfig = {
  "key": "annual-sales-amount",
  "title": "商業年間商品販売額",
  "subtitle": "総額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2020,
      2022,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "annual-sales-amount",
  "seoTitle": "商業年間商品販売額ランキング都道府県【2022年】｜1位東京都（211,933,731百万円）",
  "seoDescription": "2022年の商業年間商品販売額の都道府県別ランキング。1位東京都（211,933,731百万円）、最下位鳥取県（1,302,355百万円）で162.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
