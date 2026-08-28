import type { MetricConfig } from "../types";

export const themeProstitutionCrimeRecognitionCount: MetricConfig = {
  "key": "theme-prostitution-crime-recognition-count",
  "title": "風俗犯認知件数",
  "description": "風俗犯の認知件数。安全テーマの罪種構成チャート専用系列。",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010111",
    "cdCat01": "K420105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
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
