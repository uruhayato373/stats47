import type { MetricConfig } from "../types";

export const populationMigrationInterPrefecture: MetricConfig = {
  "key": "population-migration-inter-prefecture",
  "title": "都道府県間人口移動 (転入・転出)",
  "subtitle": "住民基本台帳人口移動報告",
  "description": "47 都道府県 × 47 都道府県のペア観測。inflow = partner→focus、outflow = focus→partner、net = inflow - outflow。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003423613",
    "cdCat02": "0",
  },
  "entities": [
    "migration-flow",
  ],
  "years": "all",
  "yearFormat": "calendar",
  "visualization": {
    "preset": "migration-flow",
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "isPairRelationship": true,
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
