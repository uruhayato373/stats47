import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const outpatientsPerFulltimePhysicianPerDay: MetricConfig = {
  "key": "outpatients-per-fulltime-physician-per-day",
  "title": "一般病院外来患者数",
  "subtitle": "常勤医師1人1日当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I10106",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2017,
    "to": 2023,
  },
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
  "seoTitle": "一般病院外来患者数ランキング都道府県【2023年】｜1位北海道（8.3人）",
  "seoDescription": "2023年の一般病院外来患者数の都道府県別ランキング。1位北海道（8.3人）、最下位沖縄県（4.7人）で1.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
