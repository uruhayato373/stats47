import type { MetricConfig } from "../types";

export const grossPrefecturalIncomeGrowthRateRealH17: MetricConfig = {
  "key": "gross-prefectural-income-growth-rate-real-h17",
  "title": "県民総所得対前年増加率",
  "subtitle": "実質（H17年基準）",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2004,
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
  "seoTitle": "県民総所得対前年増加率ランキング都道府県【2014年】｜1位石川県（2.8％）",
  "seoDescription": "2014年の県民総所得対前年増加率の都道府県別ランキング。1位石川県（2.8％）、最下位佐賀県（-4.2％）で-0.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
