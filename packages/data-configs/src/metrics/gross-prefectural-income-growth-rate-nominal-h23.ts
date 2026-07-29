import type { MetricConfig } from "../types";

export const grossPrefecturalIncomeGrowthRateNominalH23: MetricConfig = {
  "key": "gross-prefectural-income-growth-rate-nominal-h23",
  "title": "県民総所得対前年増加率",
  "subtitle": "名目（H23年基準）",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01116",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2018,
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
  "seoTitle": "県民総所得対前年増加率ランキング都道府県【2018年】｜1位佐賀県（6％）",
  "seoDescription": "2018年の県民総所得対前年増加率の都道府県別ランキング。1位佐賀県（6％）、最下位愛媛県（-2.3％）で-2.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
