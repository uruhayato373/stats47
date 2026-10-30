import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const criminalRecognitionCountOfProstitutionCrimeRate: MetricConfig = {
  "key": "criminal-recognition-count-of-prostitution-crime-rate",
  "title": "刑法犯認知件数に占める風俗犯の割合",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K06405",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "刑法犯認知件数に占める風俗犯の割合ランキング都道府県【2023年】｜1位島根県（3.07％）",
  "seoDescription": "2023年の刑法犯認知件数に占める風俗犯の割合の都道府県別ランキング。1位島根県（3.07％）、最下位茨城県（0.78％）で3.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
