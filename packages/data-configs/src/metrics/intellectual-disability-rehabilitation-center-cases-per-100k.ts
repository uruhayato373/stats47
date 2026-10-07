import type { MetricConfig } from "../types";

export const intellectualDisabilityRehabilitationCenterCasesPer100k: MetricConfig = {
  "key": "intellectual-disability-rehabilitation-center-cases-per-100k",
  "title": "知的障害者更生相談所取扱実人員",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05207",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
    "isReversed": false,
    "isSymmetrized": false,
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
  "groupKey": "intellectual-disability-rehabilitation-center-cases",
  "seoTitle": "知的障害者更生相談所取扱実人員ランキング都道府県【2023年】｜1位長崎県（335人）",
  "seoDescription": "2023年の知的障害者更生相談所取扱実人員の都道府県別ランキング。1位長崎県（335人）、最下位群馬県（21.5人）で15.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
