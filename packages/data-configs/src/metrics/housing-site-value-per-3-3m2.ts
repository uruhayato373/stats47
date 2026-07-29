import type { MetricConfig } from "../types";

export const housingSiteValuePer33m2: MetricConfig = {
  "key": "housing-site-value-per-3-3m2",
  "title": "住宅敷地価額",
  "unit": "千円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010208",
    "cdCat01": "#H04201",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1977,
    "to": 2004,
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
  "seoTitle": "住宅敷地価額ランキング都道府県【2004年】｜1位東京都（781.2千円）",
  "seoDescription": "2004年の住宅敷地価額の都道府県別ランキング。1位東京都（781.2千円）、最下位沖縄県（0千円）で地図やグラフで47都道府県を比較。",
  "isActive": true,
};
