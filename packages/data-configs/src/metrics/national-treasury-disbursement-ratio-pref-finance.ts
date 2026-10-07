import type { MetricConfig } from "../types";

export const nationalTreasuryDisbursementRatioPrefFinance: MetricConfig = {
  "key": "national-treasury-disbursement-ratio-pref-finance",
  "title": "国庫支出金割合",
  "subtitle": "都道府県財政",
  "description": "都道府県財政の国庫支出金収入を、歳入決算総額で割り、100倍した割合。",
  "note": "歳入に占める国庫支出金の構成比であり、国庫支出金の金額そのものや、都道府県の自主財源割合を直接示す指標ではない。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0210301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1980,
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
  "seoTitle": "国庫支出金割合ランキング都道府県【2022年】｜1位沖縄県（32.51％）",
  "seoDescription": "2022年の国庫支出金割合の都道府県別ランキング。1位沖縄県（32.51％）、最下位東京都（12.9％）で2.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
