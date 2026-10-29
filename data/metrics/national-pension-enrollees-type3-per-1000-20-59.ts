import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const nationalPensionEnrolleesType3Per10002059: MetricConfig = {
  "key": "national-pension-enrollees-type3-per-1000-20-59",
  "title": "第3号国民年金被保険者数",
  "subtitle": "20～59歳人口千人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J0610102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
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
    "decimalPlaces": 1,
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
  "seoTitle": "第3号国民年金被保険者数ランキング都道府県【2022年】｜1位奈良県（145.9人）",
  "seoDescription": "2022年の第3号国民年金被保険者数の都道府県別ランキング。1位奈良県（145.9人）、最下位山形県（75.7人）で1.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
