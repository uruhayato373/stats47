import type { MetricConfig } from "../types";

export const juniorHighSchoolCountPer100k1214: MetricConfig = {
  "key": "junior-high-school-count-per-100k-12-14",
  "title": "中学校数",
  "subtitle": "12〜14歳人口当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0110102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2002,
      2003,
      2004,
      2005,
      2006,
      2007,
      2008,
      2009,
      2010,
      2011,
      2012,
      2024,
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
        "unit": "校/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "校/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "junior-high-school-count",
  "seoTitle": "中学校数ランキング都道府県【2024年】｜1位高知県（707.5校）",
  "seoDescription": "2024年の中学校数の都道府県別ランキング。1位高知県（707.5校）、最下位神奈川県（202.9校）で3.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
