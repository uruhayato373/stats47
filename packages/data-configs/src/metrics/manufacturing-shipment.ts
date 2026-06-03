import type { MetricConfig } from "../types";

export const manufacturingShipment: MetricConfig = {
  "key": "manufacturing-shipment",
  "title": "製造品出荷額等",
  "subtitle": "総額（旧統計）",
  "unit": "百万円",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000020203",
    "cdCat01": "C3401",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 1980,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "百万円/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "groupKey": "manufacturing-shipment",
  "seoTitle": "製造品出荷額等ランキング市区町村【2022年】｜1位愛知県 豊田市（16,814,436百万円）",
  "seoDescription": "2022年の製造品出荷額等の市区町村別ランキング。1位愛知県 豊田市（16,814,436百万円）、最下位沖縄県 伊是名村（0百万円）で地図やグラフで市区町村を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
