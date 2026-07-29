import type { MetricConfig } from "../types";

export const suicideRatePer100k: MetricConfig = {
  "key": "suicide-rate-per-100k",
  "title": "自殺率",
  "unit": "人口10万対",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I910803",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2023,
  },
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
  "seoTitle": "自殺率ランキング都道府県【2023年】｜1位和歌山県（21.8‐）",
  "seoDescription": "2023年の自殺率の都道府県別ランキング。1位和歌山県（21.8‐）、最下位福井県（13.6‐）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
