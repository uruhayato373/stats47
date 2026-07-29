import type { MetricConfig } from "../types";

export const vaccinationRecipientsDisease: MetricConfig = {
  "key": "vaccination-recipients-disease",
  "title": "ＨＰＶワクチン定期予防接種者数（都道府県別）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004027806",
    "cdCat01": "120",
    "cdCat02": "380",
    "displayName": "ＨＰＶワクチン定期予防接種者数（都道府県別・2020年度）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004027806",
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
