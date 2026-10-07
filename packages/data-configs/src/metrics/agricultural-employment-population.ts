import type { MetricConfig } from "../types";

export const agriculturalEmploymentPopulation: MetricConfig = {
  "key": "agricultural-employment-population",
  "title": "農業就業人口",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C310410",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1989,
      1994,
      1999,
      2000,
      2001,
      2002,
      2003,
      2004,
      2009,
      2014,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "農業就業人口（販売農家）",
  "isActive": true,
};
