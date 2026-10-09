import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const furnitureHouseholdGoodsExpenditureRatioMultiPersonHouseholds: MetricConfig = {
  "key": "furniture-household-goods-expenditure-ratio-multi-person-households",
  "title": "家具・家事用品費割合",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L02414",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2002,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        2000,
        2001,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
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
  },
  "seoTitle": "家具・家事用品費割合ランキング都道府県【2024年】｜1位和歌山県（5％）",
  "seoDescription": "2024年の家具・家事用品費割合の都道府県別ランキング。1位和歌山県（5％）、最下位鹿児島県（3.4％）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
