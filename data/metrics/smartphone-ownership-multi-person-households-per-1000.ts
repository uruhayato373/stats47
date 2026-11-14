import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const smartphoneOwnershipMultiPersonHouseholdsPer1000: MetricConfig = {
  "key": "smartphone-ownership-multi-person-households-per-1000",
  "title": "スマートフォン所有数量",
  "subtitle": "千世帯当たり",
  "unit": "台",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L03615",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2014,
    "to": 2014,
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
  "seoTitle": "スマートフォン所有数量ランキング都道府県【2014年】｜1位滋賀県（1,281台）",
  "seoDescription": "2014年のスマートフォン所有数量の都道府県別ランキング。1位滋賀県（1,281台）、最下位島根県（826台）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
