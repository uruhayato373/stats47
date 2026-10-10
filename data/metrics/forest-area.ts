import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const forestArea: MetricConfig = {
  "key": "forest-area",
  "title": "林野面積",
  "unit": "ｈａ",
  "category": "landweather",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010102",
    "cdCat01": "B1105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "years": [
      1980,
      1984,
      1990,
      2000,
      2009,
      2014,
      2019,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
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
        "unit": "ｈａ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ｈａ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "林野面積ランキング都道府県【2019年】｜1位北海道（5,503,768ｈａ）",
  "seoDescription": "2019年の林野面積の都道府県別ランキング。1位北海道（5,503,768ｈａ）、最下位大阪府（57,127ｈａ）で96.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
