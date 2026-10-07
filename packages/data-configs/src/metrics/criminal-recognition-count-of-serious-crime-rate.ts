import type { MetricConfig } from "../types";

export const criminalRecognitionCountOfSeriousCrimeRate: MetricConfig = {
  "key": "criminal-recognition-count-of-serious-crime-rate",
  "title": "刑法犯認知件数に占める凶悪犯の割合",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "刑法犯認知件数に占める凶悪犯の割合ランキング都道府県【2023年】｜1位岩手県（1.68％）",
  "seoDescription": "2023年の刑法犯認知件数に占める凶悪犯の割合の都道府県別ランキング。1位岩手県（1.68％）、最下位奈良県（0.38％）で4.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
