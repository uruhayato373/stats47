import type { MetricConfig } from "../types";

export const prefecturalIncomeGrowthRateH17: MetricConfig = {
  "key": "prefectural-income-growth-rate-h17",
  "title": "県民所得対前年増加率",
  "subtitle": "H17年基準",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2014,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県民所得対前年増加率ランキング都道府県【2014年】｜1位広島県（2.3％）",
  "seoDescription": "2014年の県民所得対前年増加率の都道府県別ランキング。1位広島県（2.3％）、最下位栃木県（-2.8％）で-0.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
