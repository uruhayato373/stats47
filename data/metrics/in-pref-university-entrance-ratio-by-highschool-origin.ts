import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const inPrefUniversityEntranceRatioByHighschoolOrigin: MetricConfig = {
  "key": "in-pref-university-entrance-ratio-by-highschool-origin",
  "title": "県内大学入学者割合",
  "subtitle": "当該県出身大学入学者に占める割合",
  "description": "当該県の高校出身である大学入学者のうち、同じ県内の大学へ入学した者の割合です。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E0940302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1994,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1980,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "県内大学入学者割合ランキング都道府県【2024年】｜1位愛知県（71.4％）",
  "seoDescription": "2024年の県内大学入学者割合の都道府県別ランキング。1位愛知県（71.4％）、最下位鳥取県（15.1％）で4.7倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
