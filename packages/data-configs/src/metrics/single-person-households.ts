import type { MetricConfig } from "../types";

export const singlePersonHouseholds: MetricConfig = {
  "key": "single-person-households",
  "title": "単独世帯数",
  "unit": "世帯",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A810105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
    "city"
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
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "世帯/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "世帯/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0
};
