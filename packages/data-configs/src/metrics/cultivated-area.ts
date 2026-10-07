import type { MetricConfig } from "../types";

export const cultivatedArea: MetricConfig = {
  "key": "cultivated-area",
  "title": "耕地面積",
  "subtitle": "総面積",
  "unit": "ｈａ",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1978,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｈａ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "cultivated-area",
  "seoTitle": "耕地面積ランキング都道府県【2024年】｜1位北海道（1,138,000ｈａ）",
  "seoDescription": "2024年の耕地面積の都道府県別ランキング。1位北海道（1,138,000ｈａ）、最下位東京都（6,090ｈａ）で186.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
