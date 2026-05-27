import type { MetricConfig } from "../types";

export const forestAreaRatio: MetricConfig = {
  "key": "forest-area-ratio",
  "title": "森林面積割合",
  "unit": "％",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010202",
    "cdCat01": "#B01202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2019,
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
  "seoTitle": "森林面積割合ランキング都道府県【2019年】｜1位高知県（83.3％）",
  "seoDescription": "2019年の森林面積割合の都道府県別ランキング。1位高知県（83.3％）、最下位大阪府（29.9％）で2.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
