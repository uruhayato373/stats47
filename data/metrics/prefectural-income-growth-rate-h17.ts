import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const prefecturalIncomeGrowthRateH17: MetricConfig = {
  "key": "prefectural-income-growth-rate-h17",
  "title": "県民所得対前年増加率",
  "subtitle": "H17年基準",
  "unit": "％",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010203",
    "cdCat01": "#C01105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2010,
    "to": 2014,
  },
  "yearExclusions": [
    {
      "years": [
        2002,
        2003,
        2004,
        2005,
        2006,
        2007,
        2008,
        2009,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateRdBu",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "zero",
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "県民所得対前年増加率 都道府県ランキング【2014年】｜1位京都府（2.3％）",
  "seoDescription": "2014年の県民所得対前年増加率を都道府県別に比較。1位は京都府（2.3％）、最下位は栃木県（-2.8％）。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
