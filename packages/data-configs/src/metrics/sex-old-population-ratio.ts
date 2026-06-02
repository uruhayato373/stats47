import type { MetricConfig } from "../types";

export const sexOldPopulationRatio: MetricConfig = {
  "key": "sex-old-population-ratio",
  "title": "人口性比",
  "subtitle": "老年人口",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A02104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
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
    "colorScheme": "interpolatePiYG",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "人口性比（65歳以上人口) (A130301/A130302)",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
