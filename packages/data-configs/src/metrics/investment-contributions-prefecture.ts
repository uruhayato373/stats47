import type { MetricConfig } from "../types";

export const investmentContributionsPrefecture: MetricConfig = {
  "key": "investment-contributions-prefecture",
  "title": "投資及び出資金",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310411",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2002,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1997,
        1998,
        1999,
        2000,
        2001,
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "投資及び出資金ランキング都道府県【2022年】｜1位東京都（370,565,186）",
  "seoDescription": "2022年の投資及び出資金の都道府県別ランキング。1位東京都（370,565,186）、最下位沖縄県（0）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
