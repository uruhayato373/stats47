import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const securitiesBalance: MetricConfig = {
  "key": "securities-balance",
  "title": "有価証券保有額",
  "subtitle": "二人以上の世帯・1世帯当たり",
  "denominator": { "kind": "household", "per": 1 },
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L430104",
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
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    // 1 世帯当たりの平均なので人口・面積当たりへの換算は意味が無い (METRIC-HOUSEHOLD-ASSET-SUBTITLE-01)
    "normalizationOptions": [],
  },
  "groupKey": "household-finance",
  "isActive": true,
};
