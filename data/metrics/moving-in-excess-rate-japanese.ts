import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const movingInExcessRateJapanese: MetricConfig = {
  "key": "moving-in-excess-rate-japanese",
  "title": "転入超過率",
  "subtitle": "日本人移動者",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010201",
    "cdCat01": "#A05301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
    "city",
  ],
  "years": {
    "from": 1976,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "転入超過率ランキング都道府県【2024年】｜1位東京都（0.5％）",
  "seoDescription": "2024年の転入超過率の都道府県別ランキング。1位東京都（0.5％）、最下位高知県（-0.48％）で-1.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
