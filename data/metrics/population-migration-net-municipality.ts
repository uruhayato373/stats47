import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";
export const populationMigrationNetMunicipality: MetricConfig = {
  "key": "population-migration-net-municipality",
  "title": "市区町村別純移動 (転入−転出)",
  "subtitle": "住民基本台帳人口移動報告",
  "description": "市区町村単位の年間転入数 - 転出数 (純移動)。Remotion MigrationFlowReel の municipalities セクションで使用。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "TODO-MUNICIPALITY-MIGRATION",
    "displayName": "住民基本台帳人口移動報告",
    "url": "https://www.stat.go.jp/data/idou/index.html"
  },
  "years": "all",
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
  },
  "entities": [
    "city"
  ],
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": false
};
