import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const pianoOwnershipMultiPersonHouseholdsPer1000: MetricConfig = {
  "key": "piano-ownership-multi-person-households-per-1000",
  "title": "ピアノ・電子ピアノ所有数量",
  "subtitle": "千世帯当たり",
  "unit": "台",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L03606",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1979,
      1984,
      1989,
      1994,
      1999,
      2004,
      2009,
      2014,
    ],
  },
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
  },
  "seoTitle": "ピアノ・電子ピアノ所有数量ランキング都道府県【2014年】｜1位山梨県（446台）",
  "seoDescription": "2014年のピアノ・電子ピアノ所有数量の都道府県別ランキング。1位山梨県（446台）、最下位青森県（215台）で2.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
