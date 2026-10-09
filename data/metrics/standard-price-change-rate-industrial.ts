import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const standardPriceChangeRateIndustrial: MetricConfig = {
  "key": "standard-price-change-rate-industrial",
  "title": "標準価格対前年平均変動率",
  "subtitle": "工業地",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010212",
    "cdCat01": "#L04306",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1991,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1976,
        1977,
        1978,
        1979,
        1981,
        1987,
        1988,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "標準価格対前年平均変動率ランキング都道府県【2024年】｜1位福岡県（11.6％）",
  "seoDescription": "2024年の標準価格対前年平均変動率の都道府県別ランキング。1位福岡県（11.6％）、最下位高知県（-0.6％）で-19.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
