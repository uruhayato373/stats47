import type { MetricConfig } from "../types";

export const miscellaneousSchoolCountPer100k: MetricConfig = {
  "key": "miscellaneous-school-count-per-100k",
  "title": "各種学校数",
  "subtitle": "人口10万人当たり",
  "unit": "校",
  "category": "educationsports",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010205",
    "cdCat01": "#E08102",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
    "to": 2024,
  },
  "yearExclusions": [
    {
      "years": [
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "校/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "校/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "miscellaneous-school-count",
  "seoTitle": "各種学校数ランキング都道府県【2024年】｜1位山口県（2.89校）",
  "seoDescription": "2024年の各種学校数の都道府県別ランキング。1位山口県（2.89校）、最下位宮崎県（0.1校）で28.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
