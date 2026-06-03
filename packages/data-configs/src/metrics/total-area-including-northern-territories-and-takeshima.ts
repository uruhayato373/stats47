import type { MetricConfig } from "../types";

export const totalAreaIncludingNorthernTerritoriesAndTakeshima: MetricConfig = {
  "key": "total-area-including-northern-territories-and-takeshima",
  "title": "総面積",
  "subtitle": "北方地域及び竹島を含む",
  "unit": "１００Ｋm2",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010202",
    "cdCat01": "#B011001",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
    "displayUnit": "100km2",
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "総面積（北方地域及び竹島を含む）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
