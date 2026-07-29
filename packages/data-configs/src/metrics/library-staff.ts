import type { MetricConfig } from "../types";

export const libraryStaff: MetricConfig = {
  "key": "library-staff",
  "title": "図書館職員数",
  "unit": "人",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G1402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2005,
      2008,
      2011,
      2015,
      2018,
      2021,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
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
  "seoTitle": "図書館職員数ランキング都道府県【2021年】｜1位東京都（8,080人）",
  "seoDescription": "2021年の図書館職員数の都道府県別ランキング。1位東京都（8,080人）、最下位鳥取県（277人）で29.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
