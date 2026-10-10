import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const healthCenterExpensesPrefecture: MetricConfig = {
  "key": "health-center-expenses-prefecture",
  "title": "保健所費",
  "subtitle": "都道府県財政",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D3103046",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "保健所費ランキング都道府県【2022年】｜1位北海道（9,224,335）",
  "seoDescription": "2022年の保健所費の都道府県別ランキング。1位北海道（9,224,335）、最下位福井県（237,832）で38.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
