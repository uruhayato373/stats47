import type { MetricConfig } from "../types";

export const generalHospitalBedOccupancyRate: MetricConfig = {
  "key": "general-hospital-bed-occupancy-rate",
  "title": "一般病院病床利用率",
  "description": "病床利用率は、一般病院の許可病床数に対する在院患者数の割合。100%に近いほど病床が埋まっており、感染症流行時の余力が少ないことを意味する。",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I10104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
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
        1981,
        1982,
        1983,
        1984,
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
  "seoTitle": "一般病院病床利用率ランキング都道府県【2023年】｜1位佐賀県（81.5％）",
  "seoDescription": "2023年の一般病院病床利用率の都道府県別ランキング。1位佐賀県（81.5％）、最下位福島県（64.9％）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
