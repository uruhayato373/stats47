import type { MetricConfig } from "../types";

export const themePopulationPyramid4549Male: MetricConfig = {
  "key": "theme-population-pyramid-45-49-male",
  "title": "5歳階級別人口",
  "subtitle": "45〜49歳・男性",
  "description": "45〜49歳の男性人口。テーマの人口ピラミッド専用系列。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A121001",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
  "isActive": false
};
