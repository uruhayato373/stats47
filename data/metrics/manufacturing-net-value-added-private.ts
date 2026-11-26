import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const manufacturingNetValueAddedPrivate: MetricConfig = {
  "key": "manufacturing-net-value-added-private",
  "title": "純付加価値額（製造業）",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C620107",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2020,
    "to": 2020,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "百万円/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "百万円/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "純付加価値額（民営）（製造業）",
  "isActive": true,
};
