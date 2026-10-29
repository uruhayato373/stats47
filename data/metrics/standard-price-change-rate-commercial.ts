import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const standardPriceChangeRateCommercial: MetricConfig = {
  "key": "standard-price-change-rate-commercial",
  "title": "標準価格対前年平均変動率",
  "subtitle": "商業地",
  "unit": "％",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04304",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "isReversed": false,
    "isSymmetrized": false,
    "divergingMidpoint": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "標準価格対前年平均変動率ランキング都道府県【2024年】｜1位東京都（8.4％）",
  "seoDescription": "2024年の標準価格対前年平均変動率の都道府県別ランキング。1位東京都（8.4％）、最下位徳島県（-1.4％）で-6.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
