import type { MetricConfig } from "../types";

export const rabiesVaccinationDogs: MetricConfig = {
  "key": "rabies-vaccination-dogs",
  "title": "犬予防注射済票交付数（都道府県別・総数）",
  "unit": "件",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0004026906",
    "cdCat01": "100",
    "displayName": "犬予防注射済票交付数（都道府県別・総数）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0004026906",
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
