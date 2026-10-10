import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const urbanPlanningArea: MetricConfig = {
  "key": "urban-planning-area",
  "title": "都市計画区域指定面積",
  "unit": "ha",
  "category": "infrastructure",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H8101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 2022,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        2005,
        2006,
        2007,
        2008,
        2009,
        2010,
        2011,
        2012,
        2013,
        2014,
        2015,
        2016,
        2017,
        2018,
        2019,
        2020,
        2021,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
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
        "unit": "ha/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ha/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "都市計画区域指定面積ランキング都道府県【2023年】｜1位北海道（643,707ha）",
  "seoDescription": "2023年の都市計画区域指定面積の都道府県別ランキング。1位北海道（643,707ha）、最下位徳島県（62,523ha）で10.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
