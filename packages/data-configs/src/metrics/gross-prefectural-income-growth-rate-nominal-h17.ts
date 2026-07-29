import type { MetricConfig } from "../types";

export const grossPrefecturalIncomeGrowthRateNominalH17: MetricConfig = {
  "key": "gross-prefectural-income-growth-rate-nominal-h17",
  "title": "県民総所得対前年増加率",
  "subtitle": "名目（H17年基準）",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01106",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2002,
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
  "seoTitle": "県民総所得対前年増加率ランキング都道府県【2014年】｜1位京都府（3.5％）",
  "seoDescription": "2014年の県民総所得対前年増加率の都道府県別ランキング。1位京都府（3.5％）、最下位栃木県（-1％）で-3.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
