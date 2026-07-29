import type { MetricConfig } from "../types";

export const welfareExpenditure: MetricConfig = {
  "key": "welfare-expenditure",
  "title": "民生費（歳出決算）",
  "subtitle": "歳出決算額",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D310303",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 0.000001,
    "decimalPlaces": 0,
    "displayUnit": "億円",
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "千円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "千円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "expenditure-purpose",
  "seoTitle": "民生費（歳出決算）ランキング都道府県【2022年】｜1位東京都（1,244,742,759千円）",
  "seoDescription": "2022年の民生費（歳出決算）の都道府県別ランキング。1位東京都（1,244,742,759千円）、最下位鳥取県（52,342,502千円）で23.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
