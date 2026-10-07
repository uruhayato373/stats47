import type { MetricConfig } from "../types";

export const dentalCheckupGuidancePersonsPer1000: MetricConfig = {
  "key": "dental-checkup-guidance-persons-per-1000",
  "title": "歯科健診・保健指導延人員",
  "subtitle": "人口1000人当たり（別統計）",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I13207",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1976,
    "to": 2020,
  },
  "yearExclusions": [
    {
      "years": [
        1975,
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
  "groupKey": "dental-checkup-guidance-persons",
  "seoTitle": "歯科健診・保健指導延人員ランキング都道府県【2020年】｜1位鹿児島県（50.5人）",
  "seoDescription": "2020年の歯科健診・保健指導延人員の都道府県別ランキング。1位鹿児島県（50.5人）、最下位京都府（15.9人）で3.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
