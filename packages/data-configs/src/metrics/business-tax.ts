import type { MetricConfig } from "../types";

export const businessTax: MetricConfig = {
  "key": "business-tax",
  "title": "事業税",
  "unit": "千円",
  "category": "administrativefinancial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010104",
    "cdCat01": "D4203",
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
    "colorScheme": "interpolateGreens",
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
  "groupKey": "local-tax",
  "seoTitle": "事業税ランキング都道府県【2022年】｜1位東京都（1,544,976,077千円）",
  "seoDescription": "2022年の事業税の都道府県別ランキング。1位東京都（1,544,976,077千円）、最下位鳥取県（14,040,236千円）で110.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
