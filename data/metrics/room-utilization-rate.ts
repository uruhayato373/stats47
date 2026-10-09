import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const roomUtilizationRate: MetricConfig = {
  "key": "room-utilization-rate",
  "title": "客室稼働率",
  "description": "宿泊旅行統計調査の客室稼働率（利用客室数 ÷ 総客室数）で、従業者数10人以上の宿泊施設の値。",
  "unit": "％",
  "category": "tourism",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010207",
    "cdCat01": "#G04308",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2009,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "isReversed": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "客室稼働率ランキング都道府県【2024年】｜1位東京都（80.4％）",
  "seoDescription": "2024年の客室稼働率の都道府県別ランキング。1位東京都（80.4％）、最下位長野県（57.8％）で1.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
