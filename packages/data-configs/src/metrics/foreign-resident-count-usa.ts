import type { MetricConfig } from "../types";

export const foreignResidentCountUsa: MetricConfig = {
  "key": "foreign-resident-count-usa",
  "title": "外国人人口",
  "subtitle": "米国籍",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1703",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1985,
      1990,
      1995,
      2000,
      2005,
      2010,
      2015,
      2020,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "foreign-resident-count-usa",
  "seoTitle": "外国人人口ランキング都道府県【2020年】｜1位東京都（16,507）",
  "seoDescription": "2020年の外国人人口の都道府県別ランキング。1位東京都（16,507）、最下位鳥取県（62）で266.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
