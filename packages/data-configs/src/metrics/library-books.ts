import type { MetricConfig } from "../types";

export const libraryBooks: MetricConfig = {
  "key": "library-books",
  "title": "図書館蔵書数",
  "unit": "冊",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010107",
    "cdCat01": "G1403",
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
        "unit": "冊/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "冊/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "冊/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "図書館蔵書数ランキング都道府県【2021年】｜1位東京都（49,412,510冊）",
  "seoDescription": "2021年の図書館蔵書数の都道府県別ランキング。1位東京都（49,412,510冊）、最下位高知県（3,118,552冊）で15.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
