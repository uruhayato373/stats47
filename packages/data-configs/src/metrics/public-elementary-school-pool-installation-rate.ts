import type { MetricConfig } from "../types";

export const publicElementarySchoolPoolInstallationRate: MetricConfig = {
  "key": "public-elementary-school-pool-installation-rate",
  "title": "公立小学校プール設置率",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E02701",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1995,
      1996,
      1997,
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
  "seoTitle": "公立小学校プール設置率ランキング都道府県【2006年】｜1位埼玉県（99.3％）",
  "seoDescription": "2006年の公立小学校プール設置率の都道府県別ランキング。1位埼玉県（99.3％）、最下位北海道（36.6％）で2.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
