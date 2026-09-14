import type { MetricConfig } from "../types";

export const mothersAgeAtFirstBirth: MetricConfig = {
  "key": "mothers-age-at-first-birth",
  "title": "第1子出生時の母の平均年齢",
  "unit": "歳",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0003411610",
    "cdCat01": "00110",
    "cdCat02": "00110",
    "displayName": "人口動態調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&toukei=00450011",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2015,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "isActive": true,
};
