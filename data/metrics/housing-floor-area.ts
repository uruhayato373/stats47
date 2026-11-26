import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const housingFloorArea: MetricConfig = {
  "key": "housing-floor-area",
  "title": "1住宅当たり延べ面積",
  "description": "住宅・土地統計調査における1住宅当たりの床面積の合計。居住室に加え、玄関、台所、トイレ、浴室、廊下、階段、押入れや住宅内の営業用部分を含む。",
  "note": "別棟の物置・車庫や営業用の附属建物、共同住宅の共用廊下・階段は含まない。2013年・2018年は福島県の一部避難地域が調査対象外。",
  "unit": "m²",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020308",
    "cdCat01": "#H02103",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1983,
      1988,
      1993,
      1998,
      2003,
      2008,
      2013,
      2018,
      2023,
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
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "m²/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "m²/100km²",
        "decimalPlaces": 2,
      },
    ],
  },
  "isActive": true,
};
