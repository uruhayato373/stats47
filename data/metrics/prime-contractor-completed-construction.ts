import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const primeContractorCompletedConstruction: MetricConfig = {
  "key": "prime-contractor-completed-construction",
  "title": "元請完成工事高",
  "subtitle": "総額",
  "unit": "百万円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3304",
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
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "元請完成工事高ランキング都道府県【2023年】｜1位東京都（32,398,018百万円）",
  "seoDescription": "2023年の元請完成工事高の都道府県別ランキング。1位東京都（32,398,018百万円）、最下位鳥取県（266,747百万円）で121.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
