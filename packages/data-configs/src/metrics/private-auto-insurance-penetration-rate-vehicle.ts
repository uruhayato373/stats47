import type { MetricConfig } from "../types";

export const privateAutoInsurancePenetrationRateVehicle: MetricConfig = {
  "key": "private-auto-insurance-penetration-rate-vehicle",
  "title": "任意自動車保険普及率",
  "subtitle": "車両",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10501",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1983,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
  "seoTitle": "任意自動車保険普及率ランキング都道府県【2023年】｜1位愛知県（59.4％）",
  "seoDescription": "2023年の任意自動車保険普及率の都道府県別ランキング。1位愛知県（59.4％）、最下位沖縄県（30.1％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
