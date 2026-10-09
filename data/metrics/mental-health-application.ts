import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const mentalHealthApplication: MetricConfig = {
  "key": "mental-health-application",
  "title": "精神障害者申請通報届出件数（都道府県別・総数）",
  "unit": "件",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026960",
    "cdTab": "0390",
    "cdCat01": "100",
    "cdCat02": "100",
    "displayName": "精神障害者申請通報届出件数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026960",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
