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
  "seoTitle": "県民総所得対前年増加率 都道府県ランキング【2014年】｜1位宮城県（3.5％）",
  "seoDescription": "2014年の県民総所得対前年増加率を都道府県別に比較。1位は宮城県（3.5％）、最下位は栃木県（-1.0％）。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
