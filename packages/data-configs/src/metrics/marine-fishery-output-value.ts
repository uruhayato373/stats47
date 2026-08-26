import type { MetricConfig } from "../types";

export const marineFisheryOutputValue: MetricConfig = {
  "key": "marine-fishery-output-value",
  "title": "海面漁業産出額",
  "description": "海面漁業の魚種別生産量に魚種別価格を乗じて推計した、水産物の産出額です。",
  "unit": "百万円",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C312001",
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
    "colorScheme": "interpolateGreens",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "百万円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "百万円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "fishery",
  "seoTitle": "海面漁業産出額ランキング都道府県【2023年】｜1位北海道（239,620百万円）",
  "seoDescription": "2023年の海面漁業産出額の都道府県別ランキング。1位北海道（239,620百万円）、最下位奈良県（0百万円）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
