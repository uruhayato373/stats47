import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const gasolineSalesVolume: MetricConfig = {
  "key": "gasoline-sales-volume",
  "title": "ガソリン販売量",
  "unit": "ＫＬ",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H05105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1985,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
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
        "unit": "ＫＬ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "ＫＬ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "ガソリン販売量ランキング都道府県【2023年】｜1位東京都（4,244,833ＫＬ）",
  "seoDescription": "2023年のガソリン販売量の都道府県別ランキング。1位東京都（4,244,833ＫＬ）、最下位島根県（249,750ＫＬ）で17.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
