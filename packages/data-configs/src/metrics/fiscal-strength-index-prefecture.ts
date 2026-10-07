import type { MetricConfig } from "../types";

export const fiscalStrengthIndexPrefecture: MetricConfig = {
  "key": "fiscal-strength-index-prefecture",
  "title": "財政力指数",
  "subtitle": "都道府県財政",
  "description": "都道府県の基準財政収入額を基準財政需要額で割った値について、過去3年間を平均した指数。",
  "note": "値が高いほど普通交付税算定上の留保財源が大きく、一般に財源の余裕があることを示す。単年度の収支や財政黒字率ではない。",
  "unit": "指数",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D2101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture"
  ],
  "years": {
    "from": 1981,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 5
  },
  "calculation": {
    "isCalculated": false
  },
  "seoTitle": "財政力指数ランキング都道府県【2022年】｜1位東京都（1.06‐）",
  "seoDescription": "2022年の財政力指数の都道府県別ランキング。1位東京都（1.06‐）、最下位島根県（0.25‐）で4.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true
};
