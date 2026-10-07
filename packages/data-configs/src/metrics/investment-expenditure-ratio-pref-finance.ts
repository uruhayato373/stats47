import type { MetricConfig } from "../types";

export const investmentExpenditureRatioPrefFinance: MetricConfig = {
  "key": "investment-expenditure-ratio-pref-finance",
  "title": "投資的経費の割合",
  "subtitle": "都道府県財政",
  "description": "都道府県の歳出総額に占める普通建設事業費など投資的経費の割合。社会資本整備への配分を示す。",
  "unit": "％",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010204",
    "cdCat01": "#D0140201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "投資的経費の割合 都道府県ランキング【2022年】｜1位福井県（23.5％）",
  "seoDescription": "2022年の投資的経費の割合を都道府県別に比較。1位は福井県（23.5％）、最下位は大阪府（4.8％）、最大と最小の差は4.9倍です。地図やグラフで47都道府県の違いを確認できます。",
  "isActive": true,
};
