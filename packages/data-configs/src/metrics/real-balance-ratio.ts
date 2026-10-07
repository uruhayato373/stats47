import type { MetricConfig } from "../types";

export const realBalanceRatio: MetricConfig = {
  "key": "real-balance-ratio",
  "title": "実質収支比率",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1981,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "minValueType": "data-min",
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "実質収支比率ランキング都道府県【2022年】｜1位島根県（7.5％）",
  "seoDescription": "2022年の実質収支比率の都道府県別ランキング。1位島根県（7.5％）、最下位長崎県（0.3％）で25.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
