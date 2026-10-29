import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const stillbirthRate: MetricConfig = {
  "key": "stillbirth-rate",
  "title": "死産率",
  "subtitle": "出産数千当たり",
  "unit": "出産千対",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07101",
    "displayName": "人口動態統計",
    "url": "https://www.mhlw.go.jp/toukei/list/81-1.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1980,
    "to": 2023,
  },
  "yearFormat": "calendar",
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
  },
  "seoTitle": "死産率ランキング都道府県【2023年】｜1位北海道（25.3）",
  "seoDescription": "2023年の死産率の都道府県別ランキング。1位北海道（25.3）、最下位石川県（15.4）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
