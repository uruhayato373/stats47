import type { MetricConfig } from "../types";

export const publicHealthNurseCountPer100k: MetricConfig = {
  "key": "public-health-nurse-count-per-100k",
  "title": "保健師数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I12201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1975,
      1976,
      1977,
      1978,
      1979,
      1980,
      1981,
      1982,
      1984,
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
    "decimalPlaces": 1,
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
  "groupKey": "public-health-nurse-count",
  "seoTitle": "保健師数ランキング都道府県【2022年】｜1位長野県（91.9人）",
  "seoDescription": "2022年の保健師数の都道府県別ランキング。1位長野県（91.9人）、最下位大阪府（30.1人）で3.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
