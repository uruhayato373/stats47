import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const fireDepartmentCountPer100Km2: MetricConfig = {
  "key": "fire-department-count-per-100-km2",
  "title": "消防署数",
  "unit": "署",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01102",
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
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "署/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "署/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消防署数ランキング都道府県【2024年】｜1位東京都（21.6署）",
  "seoDescription": "2024年の消防署数の都道府県別ランキング。1位東京都（21.6署）、最下位北海道（1.9署）で11.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
