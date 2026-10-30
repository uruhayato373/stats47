import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const lowestTemperature: MetricConfig = {
  "key": "lowest-temperature",
  "title": "最低気温",
  "subtitle": "日最低気温の月平均の最低値",
  "description": "各都道府県の代表観測地点における、日最低気温の月平均値のうち年間で最も低い値です。観測史上の最低気温や県全域の平均気温ではありません。",
  "unit": "℃",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B4103",
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
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "最低気温ランキング都道府県【2024年】｜1位沖縄県（15.3℃）",
  "seoDescription": "2024年の最低気温の都道府県別ランキング。1位沖縄県（15.3℃）、最下位北海道（-5.1℃）で-3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
