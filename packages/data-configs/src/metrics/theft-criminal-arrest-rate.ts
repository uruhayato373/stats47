import type { MetricConfig } from "../types";

export const theftCriminalArrestRate: MetricConfig = {
  "key": "theft-criminal-arrest-rate",
  "title": "窃盗犯検挙率",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06204",
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "窃盗犯検挙率ランキング都道府県【2023年】｜1位島根県（72.5％）",
  "seoDescription": "2023年の窃盗犯検挙率の都道府県別ランキング。1位島根県（72.5％）、最下位大阪府（19.9％）で3.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
