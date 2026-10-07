import type { MetricConfig } from "../types";

export const trafficAccidentDeathsPer100Accidents: MetricConfig = {
  "key": "traffic-accident-deaths-per-100-accidents",
  "title": "交通事故死者数",
  "subtitle": "交通事故100件当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "交通事故死者数を交通事故発生件数で除し、交通事故100件当たりに換算した値。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04202",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1983,
    "to": 2024,
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
      ],
      "reason": "2026-10 の移行時に当時の years から引き継いだ除外 (まだ判断していない。根拠が無ければ外して年を戻す)",
    },
  ],
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
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
  "groupKey": "traffic-accident-deaths-per-100-accidents",
  "seoTitle": "交通事故死者数（交通事故100件当たり）ランキング都道府県",
  "seoDescription": "交通事故100件当たりの交通事故死者数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};
