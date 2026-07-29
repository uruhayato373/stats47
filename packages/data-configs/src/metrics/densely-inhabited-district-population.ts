import type { MetricConfig } from "../types";

export const denselyInhabitedDistrictPopulation: MetricConfig = {
  "key": "densely-inhabited-district-population",
  "title": "人口集中地区人口",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1801",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1975,
      1980,
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "人口集中地区人口ランキング都道府県【2020年】｜1位東京都（13,844,009人）",
  "seoDescription": "2020年の人口集中地区人口の都道府県別ランキング。1位東京都（13,844,009人）、最下位島根県（171,792人）で80.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
