import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const numberOfConstructedBuildings: MetricConfig = {
  "key": "number-of-constructed-buildings",
  "title": "着工建築物数",
  "unit": "棟",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3301",
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
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "棟/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "棟/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "着工建築物数ランキング都道府県【2024年】｜1位東京都（40,257棟）",
  "seoDescription": "2024年の着工建築物数の都道府県別ランキング。1位東京都（40,257棟）、最下位高知県（2,237棟）で18.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
