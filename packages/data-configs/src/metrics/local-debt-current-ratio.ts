import type { MetricConfig } from "../types";

export const localDebtCurrentRatio: MetricConfig = {
  "key": "local-debt-current-ratio",
  "title": "地方債現在高の割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0130201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1986,
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
        1981,
        1982,
        1983,
        1984,
        1985,
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
  "seoTitle": "地方債現在高の割合ランキング都道府県【2022年】｜1位静岡県（208.5％）",
  "seoDescription": "2022年の地方債現在高の割合の都道府県別ランキング。1位静岡県（208.5％）、最下位東京都（41.6％）で5.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
