import type { MetricConfig } from "../types";

export const housingCostAllHouseholds: MetricConfig = {
  "key": "housing-cost-all-households",
  "title": "住居費（全世帯）",
  "subtitle": "社会・人口統計体系による全世帯（単身世帯を含む）1世帯当たり年間の住居費",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L320102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolatePurples",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": []
  },
  "isActive": true,
};
