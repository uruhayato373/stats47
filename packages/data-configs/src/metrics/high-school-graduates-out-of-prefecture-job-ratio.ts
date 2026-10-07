import type { MetricConfig } from "../types";

export const highSchoolGraduatesOutOfPrefectureJobRatio: MetricConfig = {
  "key": "high-school-graduates-out-of-prefecture-job-ratio",
  "title": "高等学校卒業者に占める県外就職者の割合",
  "subtitle": "高校卒業後の就職者に占める割合",
  "description": "高校卒業後に就職した人のうち、学校の所在県以外に就職した人の割合です。就職者数から県内就職者数を引き、就職者数で割って100を乗じます。卒業者全員を分母にはしません。",
  "note": "学校基本調査に基づく進路です。住所の転出や若年人口全体の移動率とは異なります。計算式は総務省統計局『統計でみる都道府県のすがた』#F03302を参照。",
  "unit": "％",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010206",
    "cdCat01": "#F03302",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2023,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
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
  "seoTitle": "高等学校卒業者に占める県外就職者の割合ランキング都道府県【2023年】｜1位青森県（41.1％）",
  "seoDescription": "2023年の高等学校卒業者に占める県外就職者の割合の都道府県別ランキング。1位青森県（41.1％）、最下位愛知県（4.9％）で8.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
