import type { MetricConfig } from "../types";

export const maximumSnowDepth: MetricConfig = {
  "key": "maximum-snow-depth",
  "title": "最深積雪",
  "unit": "ｃｍ",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4110",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2007,
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
        "unit": "ｃｍ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｃｍ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "最深積雪ランキング都道府県【2007年】｜1位北海道（78ｃｍ）",
  "seoDescription": "2007年の最深積雪の都道府県別ランキング。1位北海道（78ｃｍ）、最下位沖縄県（0ｃｍ）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
