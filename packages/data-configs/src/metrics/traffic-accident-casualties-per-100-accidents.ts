import type { MetricConfig } from "../types";

export const trafficAccidentCasualtiesPer100Accidents: MetricConfig = {
  "key": "traffic-accident-casualties-per-100-accidents",
  "title": "交通事故死傷者数",
  "subtitle": "事故100件当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K04201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1979,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
        1976,
        1977,
        1978,
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
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "traffic-accident-casualties-per-100-accidents",
  "seoTitle": "交通事故死傷者数ランキング都道府県【2024年】｜1位佐賀県（131.4人）",
  "seoDescription": "2024年の交通事故死傷者数の都道府県別ランキング。1位佐賀県（131.4人）、最下位東京都（110.9人）で1.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
