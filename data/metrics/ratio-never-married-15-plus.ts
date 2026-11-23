import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const ratioNeverMarried15Plus: MetricConfig = {
  "key": "ratio-never-married-15-plus",
  "title": "未婚者割合",
  "subtitle": "15歳以上総数",
  "description": "国勢調査の15歳以上人口に占める、まだ結婚したことのない人の割合。",
  "note": "配偶関係は届出の有無ではなく実際の状態で区分する。死別・離別後に独身の人は未婚ではなく、それぞれ死別・離別に分類される。",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A0411001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      2015,
      2020,
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
    "decimalPlaces": 5,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
