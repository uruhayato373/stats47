import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const maximumTemperature: MetricConfig = {
  "key": "maximum-temperature",
  "title": "最高気温",
  "subtitle": "日最高気温の月平均の最高値",
  "description": "各都道府県の代表観測地点における、日最高気温の月平均値のうち年間で最も高い値です。観測史上の最高気温や県全域の平均気温ではありません。",
  "unit": "℃",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "barDomain": { "mode": "extent" },
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false
  },
  "isActive": true,
};
