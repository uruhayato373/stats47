import type { MetricConfig } from "../types";

export const patientReceivingRateByDisease: MetricConfig = {
  "key": "patient-receiving-rate-by-disease",
  "title": "受療率（総数・入院総数）（患者調査）",
  "subtitle": "傷病別",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026105",
    "cdCat01": "1",
    "displayName": "受療率（総数・入院総数）（2023年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026105",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
