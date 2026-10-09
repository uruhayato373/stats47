import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const secondaryIndustryEstablishmentRatioCensus: MetricConfig = {
  "key": "secondary-industry-establishment-ratio-census",
  "title": "第2次産業事業所数構成比",
  "subtitle": "経済センサス",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C02102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2001,
      2006,
    ],
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1978,
        1981,
        1986,
        1991,
        1996,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "第2次産業事業所数構成比ランキング都道府県【2006年】｜1位岐阜県（25.81％）",
  "seoDescription": "2006年の第2次産業事業所数構成比の都道府県別ランキング。1位岐阜県（25.81％）、最下位沖縄県（10.91％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
