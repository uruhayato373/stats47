import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const dualIncomeHouseholdRatio: MetricConfig = {
  "key": "dual-income-household-ratio",
  "title": "共働き世帯割合",
  "unit": "％",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F01503",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      2005,
      2010,
      2015,
      2020,
    ],
  },
  "yearExclusions": [
    {
      "years": [
        1980,
        1985,
        1990,
        1995,
        2000,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "calendar",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "共働き世帯割合ランキング都道府県【2020年】｜1位福井県（34.69％）",
  "seoDescription": "2020年の共働き世帯割合の都道府県別ランキング。1位福井県（34.69％）、最下位東京都（17.43％）で2.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
