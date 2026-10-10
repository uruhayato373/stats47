import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const suicideCount65plus: MetricConfig = {
  "key": "suicide-count-65plus",
  "title": "65歳以上の自殺者数",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I9109",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2005,
    "to": 2023,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "65歳以上の自殺者数ランキング都道府県【2023年】｜1位東京都（529人）",
  "seoDescription": "2023年の65歳以上の自殺者数の都道府県別ランキング。1位東京都（529人）、最下位鳥取県（19人）で27.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
