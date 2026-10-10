import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const stillbirthsAfter22Weeks: MetricConfig = {
  "key": "stillbirths-after-22-weeks",
  "title": "死産数",
  "subtitle": "妊娠22週以後",
  "unit": "胎",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A4271",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
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
        1995,
        1996,
        1997,
        1998,
        1999,
        2000,
        2001,
        2002,
        2003,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
        "unit": "胎/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "胎/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "死産数ランキング都道府県【2023年】｜1位東京都（225胎）",
  "seoDescription": "2023年の死産数の都道府県別ランキング。1位東京都（225胎）、最下位島根県（7胎）で32.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
