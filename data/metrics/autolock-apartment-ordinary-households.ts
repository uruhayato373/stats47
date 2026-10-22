import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const autolockApartmentOrdinaryHouseholds: MetricConfig = {
  "key": "autolock-apartment-ordinary-households",
  "title": "オートロック式共同住宅に住む世帯数",
  "subtitle": "普通世帯",
  "unit": "世帯",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020208",
    "cdCat01": "H2283",
    "displayName": "社会・人口統計体系（市区町村データ・廃置分合処理済）",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2013,
    "to": 2018,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
