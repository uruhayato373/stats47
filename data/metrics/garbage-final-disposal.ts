import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const garbageFinalDisposal: MetricConfig = {
  "key": "garbage-final-disposal",
  "title": "ごみ最終処分量",
  "unit": "t",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5615",
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
        1999,
        2000,
        2001,
        2002,
        2003,
        2004,
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
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 0,
    "displayUnit": "万t",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "t/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "t/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ごみ最終処分量ランキング都道府県【2023年】｜1位大阪府（319,002t）",
  "seoDescription": "2023年のごみ最終処分量の都道府県別ランキング。1位大阪府（319,002t）、最下位高知県（8,442t）で37.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
