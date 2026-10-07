import type { MetricConfig } from "../types";

export const simpleLifeInsuranceContractCountPerPopulation: MetricConfig = {
  "key": "simple-life-insurance-contract-count-per-population",
  "title": "簡易生命保険保有契約件数",
  "subtitle": "人口当たり",
  "unit": "件",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2006,
  },
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "simple-life-insurance-contract-count",
  "seoTitle": "簡易生命保険保有契約件数ランキング都道府県【2006年】｜1位山形県（609.8件）",
  "seoDescription": "2006年の簡易生命保険保有契約件数の都道府県別ランキング。1位山形県（609.8件）、最下位沖縄県（177.5件）で3.4倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
