import type { MetricConfig } from "../types";

export const disasterRecoveryExpenditureRatioPrefFinance: MetricConfig = {
  "key": "disaster-recovery-expenditure-ratio-pref-finance",
  "title": "災害復旧費割合",
  "subtitle": "都道府県財政",
  "unit": "％",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0312301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1978,
    "to": 2022,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "災害復旧費割合ランキング都道府県【2022年】｜1位熊本県（5％）",
  "seoDescription": "2022年の災害復旧費割合の都道府県別ランキング。1位熊本県（5％）、最下位大阪府（0.01％）で500.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
