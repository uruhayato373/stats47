import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const maternalMortalityRatePer100kBirths: MetricConfig = {
  "key": "maternal-mortality-rate-per-100k-births",
  "title": "妊娠等による死亡率",
  "subtitle": "出産数10万当たり",
  "unit": "出産10万対",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I07105",
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
  "seoTitle": "妊娠等による死亡率ランキング都道府県【2023年】｜1位新潟県（26.9）",
  "seoDescription": "2023年の妊娠等による死亡率の都道府県別ランキング。1位新潟県（26.9）、最下位宮崎県（0）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
