import type { MetricConfig } from "../types";

export const totalAssessedLandAreaRatioPaddy: MetricConfig = {
  "key": "total-assessed-land-area-ratio-paddy",
  "title": "評価総地積割合",
  "subtitle": "田",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010202",
    "cdCat01": "#B0140101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
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
  "seoTitle": "評価総地積割合ランキング都道府県【2023年】｜1位富山県（42.7％）",
  "seoDescription": "2023年の評価総地積割合の都道府県別ランキング。1位富山県（42.7％）、最下位東京都（0.3％）で142.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
