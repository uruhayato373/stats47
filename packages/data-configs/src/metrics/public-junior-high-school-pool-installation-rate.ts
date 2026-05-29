import type { MetricConfig } from "../types";

export const publicJuniorHighSchoolPoolInstallationRate: MetricConfig = {
  "key": "public-junior-high-school-pool-installation-rate",
  "title": "公立中学校プール設置率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E02702",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2006,
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
  },
  "seoTitle": "公立中学校プール設置率ランキング都道府県【2006年】｜1位東京都（98.4％）",
  "seoDescription": "2006年の公立中学校プール設置率の都道府県別ランキング。1位東京都（98.4％）、最下位北海道（5.4％）で18.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
