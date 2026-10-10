import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const lowBirthweightRatePer1000Births: MetricConfig = {
  "key": "low-birthweight-rate-per-1000-births",
  "title": "2,500g未満の出生率",
  "unit": "出生千対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07201",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1993,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1980,
        1981,
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "2,500g未満の出生率ランキング都道府県【2023年】｜1位沖縄県（121）",
  "seoDescription": "2023年の2,500g未満の出生率の都道府県別ランキング。1位沖縄県（121）、最下位徳島県（80.2）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
