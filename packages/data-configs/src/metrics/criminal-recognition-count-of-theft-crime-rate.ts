import type { MetricConfig } from "../types";

export const criminalRecognitionCountOfTheftCrimeRate: MetricConfig = {
  "key": "criminal-recognition-count-of-theft-crime-rate",
  "title": "刑法犯認知件数に占める窃盗犯の割合",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06403",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1982,
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
  "seoTitle": "刑法犯認知件数に占める窃盗犯の割合ランキング都道府県【2023年】｜1位栃木県（78.19％）",
  "seoDescription": "2023年の刑法犯認知件数に占める窃盗犯の割合の都道府県別ランキング。1位栃木県（78.19％）、最下位長崎県（56.23％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
