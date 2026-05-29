import type { MetricConfig } from "../types";

export const volunteerActivityAnnualParticipationRate15plus: MetricConfig = {
  "key": "volunteer-activity-annual-participation-rate-15plus",
  "title": "ボランティア活動の年間行動者率",
  "description": "過去1年間に該当の活動をしたことのある人の割合",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G04101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      2001,
      2006,
      2011,
      2016,
      2021,
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
  "seoTitle": "ボランティア活動の年間行動者率ランキング都道府県【2021年】｜1位島根県（26.1％）",
  "seoDescription": "2021年のボランティア活動の年間行動者率の都道府県別ランキング。1位島根県（26.1％）、最下位青森県（14.2％）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
