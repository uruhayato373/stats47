import type { MetricConfig } from "../types";

export const psychiatricHospitalBedOccupancyRate: MetricConfig = {
  "key": "psychiatric-hospital-bed-occupancy-rate",
  "title": "精神科病院病床利用率",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I10204",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1981,
    "to": 2023,
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
  "seoTitle": "精神科病院病床利用率ランキング都道府県【2023年】｜1位富山県（94.1％）",
  "seoDescription": "2023年の精神科病院病床利用率の都道府県別ランキング。1位富山県（94.1％）、最下位福島県（69.3％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
