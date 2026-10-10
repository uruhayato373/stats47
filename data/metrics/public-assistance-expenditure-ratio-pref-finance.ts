import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const publicAssistanceExpenditureRatioPrefFinance: MetricConfig = {
  "key": "public-assistance-expenditure-ratio-pref-finance",
  "title": "生活保護費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0310701",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1982,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
        1979,
        1980,
        1981,
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "生活保護費割合ランキング都道府県【2022年】｜1位福岡県（1.55％）",
  "seoDescription": "2022年の生活保護費割合の都道府県別ランキング。1位福岡県（1.55％）、最下位島根県（0.02％）で77.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
