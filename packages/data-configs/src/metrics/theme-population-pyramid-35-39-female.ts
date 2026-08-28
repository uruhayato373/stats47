import type { MetricConfig } from "../types";

export const themePopulationPyramid3539Female: MetricConfig = {
  "key": "theme-population-pyramid-35-39-female",
  "title": "5歳階級別人口",
  "subtitle": "35〜39歳・女性",
  "description": "35〜39歳の女性人口。テーマの人口ピラミッド専用系列。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A120802",
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
