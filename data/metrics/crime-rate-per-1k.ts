import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const crimeRatePer1k: MetricConfig = {
  "key": "crime-rate-per-1k",
  "title": "刑法犯認知件数（人口千人当たり）",
  "subtitle": "人口1000人当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020311",
    "cdCat01": "#K06101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "years": [
      1980,
      1985,
      1990,
      1995,
      2000,
      2005,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "刑法犯認知件数（人口千人当たり）ランキング市区町村【2005年】｜1位東京都 千代田区（130.26件）",
  "seoDescription": "2005年の刑法犯認知件数（人口千人当たり）の市区町村別ランキング。1位東京都 千代田区（130.26件）、最下位沖縄県 北大東村（0件）で地図やグラフで市区町村を比較。",
  "isActive": true,
};
