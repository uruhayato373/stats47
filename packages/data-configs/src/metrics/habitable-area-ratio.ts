import type { MetricConfig } from "../types";

export const habitableAreaRatio: MetricConfig = {
  "key": "habitable-area-ratio",
  "title": "可住地面積割合",
  "unit": "％",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010202",
    "cdCat01": "#B01301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1979,
    "to": 2024,
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
  },
  "seoTitle": "可住地面積割合ランキング都道府県【2024年】｜1位大阪府（70％）",
  "seoDescription": "2024年の可住地面積割合の都道府県別ランキング。1位大阪府（70％）、最下位高知県（16.3％）で4.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
