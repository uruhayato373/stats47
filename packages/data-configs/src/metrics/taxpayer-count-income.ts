import type { MetricConfig } from "../types";

export const taxpayerCountIncome: MetricConfig = {
  "key": "taxpayer-count-income",
  "title": "納税義務者数",
  "subtitle": "所得割",
  "unit": "人",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C120120",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1986,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "納税義務者数ランキング都道府県【2024年】｜1位東京都（7,307,723人）",
  "seoDescription": "2024年の納税義務者数の都道府県別ランキング。1位東京都（7,307,723人）、最下位鳥取県（231,128人）で31.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
