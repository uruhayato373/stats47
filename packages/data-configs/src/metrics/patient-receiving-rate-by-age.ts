import type { MetricConfig } from "../types";

export const patientReceivingRateByAge: MetricConfig = {
  "key": "patient-receiving-rate-by-age",
  "title": "受療率（性年齢別総数・入院総数）（患者調査）",
  "subtitle": "性年齢別集計",
  "unit": "人口10万対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026104",
    "cdCat01": "1",
    "cdCat02": "1",
    "displayName": "受療率（性年齢別総数・入院総数）（2023年患者調査）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026104",
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
