import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

export const policeExpenditureRatioPrefFinance: MetricConfig = {
  "key": "police-expenditure-ratio-pref-finance",
  "title": "警察費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D03113",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1994,
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
        1982,
        1983,
        1984,
        1985,
        1986,
        1987,
        1988,
        1989,
        1990,
        1991,
        1992,
        1993,
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
  "seoTitle": "警察費割合ランキング都道府県【2022年】｜1位神奈川県（7.89％）",
  "seoDescription": "2022年の警察費割合の都道府県別ランキング。1位神奈川県（7.89％）、最下位岩手県（3.3％）で2.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
