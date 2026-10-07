import type { MetricConfig } from "../types";

export const garbageLandfillRate: MetricConfig = {
  "key": "garbage-landfill-rate",
  "title": "ごみ埋立率",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H055041",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2004,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1999,
        2000,
        2001,
        2002,
        2003,
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
  "seoTitle": "ごみ埋立率ランキング都道府県【2023年】｜1位北海道（16.1％）",
  "seoDescription": "2023年のごみ埋立率の都道府県別ランキング。1位北海道（16.1％）、最下位三重県（2.8％）で5.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
