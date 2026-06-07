import type { MetricConfig } from "../types";

export const annualSnowDays: MetricConfig = {
  "key": "annual-snow-days",
  "title": "年間雪日数",
  "unit": "日",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
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
        "unit": "日/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "日/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "年間雪日数ランキング都道府県【2020年】｜1位北海道（118日）",
  "seoDescription": "2020年の年間雪日数の都道府県別ランキング。1位北海道（118日）、最下位沖縄県（0日）で地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
