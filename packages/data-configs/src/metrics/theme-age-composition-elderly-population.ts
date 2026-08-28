import type { MetricConfig } from "../types";

export const themeAgeCompositionElderlyPopulation: MetricConfig = {
  "key": "theme-age-composition-elderly-population",
  "title": "年齢3区分人口",
  "subtitle": "65歳以上",
  "description": "年齢3区分のうち65歳以上人口。テーマの人口構成チャート専用系列。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1303",
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
