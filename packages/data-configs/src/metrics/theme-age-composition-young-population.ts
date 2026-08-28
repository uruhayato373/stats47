import type { MetricConfig } from "../types";

export const themeAgeCompositionYoungPopulation: MetricConfig = {
  "key": "theme-age-composition-young-population",
  "title": "年齢3区分人口",
  "subtitle": "15歳未満",
  "description": "年齢3区分のうち15歳未満人口。テーマの人口構成チャート専用系列。",
  "unit": "人",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A1301",
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
