import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const securitiesBalance: MetricConfig = {
  "key": "securities-balance",
  "title": "有価証券保有額",
  "subtitle": "二人以上の世帯の1世帯当たり",
  "unit": "千円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L430104",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1979,
      1984,
      1989,
      1994,
      1999,
      2004,
      2009,
      2014,
    ],
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    domain: { mode: "zero" },
  },
  "display": {
    "conversionFactor": 0.1,
    "decimalPlaces": 0,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
    // 1 世帯当たりの平均なので人口・面積当たりへの換算は意味が無い (METRIC-HOUSEHOLD-ASSET-SUBTITLE-01)
    "normalizationOptions": [],
  },
  "groupKey": "household-finance",
  "seoTitle": "有価証券保有額ランキング都道府県【2014年】｜1位東京都（4,303千円）",
  "seoDescription": "2014年の有価証券保有額の都道府県別ランキング。1位東京都（4,303千円）、最下位鹿児島県（508千円）で8.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
