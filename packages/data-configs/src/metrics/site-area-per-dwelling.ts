import type { MetricConfig } from "../types";

export const siteAreaPerDwelling: MetricConfig = {
  "key": "site-area-per-dwelling",
  "title": "住宅の敷地面積",
  "unit": "ｍ2",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H02104",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｍ2/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｍ2/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "住宅の敷地面積ランキング都道府県【2023年】｜1位茨城県（394ｍ2）",
  "seoDescription": "2023年の住宅の敷地面積の都道府県別ランキング。1位茨城県（394ｍ2）、最下位大阪府（138ｍ2）で2.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
