import type { MetricConfig } from "../types";

export const juniorHighSchoolClasses: MetricConfig = {
  "key": "junior-high-school-classes",
  "title": "中学校学級数",
  "unit": "学級",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010105",
    "cdCat01": "E3301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
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
        "unit": "学級/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "学級/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
};
