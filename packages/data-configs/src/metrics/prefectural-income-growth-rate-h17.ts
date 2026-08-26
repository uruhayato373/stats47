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
  "seoTitle": "県民所得対前年増加率 都道府県ランキング【2014年】｜1位京都府（2.3％）",
  "seoDescription": "2014年の県民所得対前年増加率を都道府県別に比較。1位は京都府（2.3％）、最下位は栃木県（-2.8％）。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
