import type { MetricConfig } from "../types";

export const foodBusinessFacilityPenaltiesPer1000: MetricConfig = {
  "key": "food-business-facility-penalties-per-1000",
  "title": "食品営業施設処分件数",
  "subtitle": "施設1000件当たり",
  "unit": "件",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I13402",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1984,
    "to": 2020,
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
  "groupKey": "food-business-facility-penalties",
  "seoTitle": "食品営業施設処分件数ランキング都道府県【2020年】｜1位愛媛県（3.9件）",
  "seoDescription": "2020年の食品営業施設処分件数の都道府県別ランキング。1位愛媛県（3.9件）、最下位沖縄県（0件）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
