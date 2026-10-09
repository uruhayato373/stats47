import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const mobilePhoneOwnershipMultiPersonHouseholdsPer1000: MetricConfig = {
  "key": "mobile-phone-ownership-multi-person-households-per-1000",
  "title": "携帯電話所有数量",
  "unit": "台",
  "category": "ict",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L03611",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1999,
      2004,
      2009,
      2014,
    ],
  },
  "yearFormat": "fiscal",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "携帯電話所有数量ランキング都道府県【2014年】｜1位山形県（1,391台）",
  "seoDescription": "2014年の携帯電話所有数量の都道府県別ランキング。1位山形県（1,391台）、最下位鹿児島県（1,091台）で1.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
