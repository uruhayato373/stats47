import type { MetricConfig } from "../types";

export const outpatientCount: MetricConfig = {
  "key": "outpatient-count",
  "title": "通院者率",
  "unit": "‐",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I8104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1989100000,
      1992100000,
      1995100000,
      1998100000,
      2001100000,
      2004100000,
      2007100000,
      2010100000,
      2013100000,
      2016100000,
      2019100000,
      2022100000,
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
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "‐/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "outpatient-count",
  "seoTitle": "通院者率ランキング都道府県【2022100000年】｜1位秋田県（496.2‐）",
  "seoDescription": "2022100000年の通院者率の都道府県別ランキング。1位秋田県（496.2‐）、最下位沖縄県（358.5‐）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
