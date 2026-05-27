import type { MetricConfig } from "../types";

export const generalHospitalPer100k: MetricConfig = {
  "key": "general-hospital-per-100k",
  "title": "一般病院数（人口10万人当たり）",
  "unit": "施設",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020309",
    "cdCat01": "#I0910103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
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
        "unit": "施設/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "施設/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "一般病院数（人口10万人当たり）ランキング市区町村【2020年】｜1位高知県 越知町（77.1施設）",
  "seoDescription": "2020年の一般病院数（人口10万人当たり）の市区町村別ランキング。1位高知県 越知町（77.1施設）、最下位沖縄県 与那国町（0施設）で地図やグラフで市区町村を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
