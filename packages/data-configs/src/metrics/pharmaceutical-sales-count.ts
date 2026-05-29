import type { MetricConfig } from "../types";

export const pharmaceuticalSalesCount: MetricConfig = {
  "key": "pharmaceutical-sales-count",
  "title": "医薬品販売業数",
  "unit": "所",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010109",
    "cdCat01": "I7101",
    "displayName": "社会・人口統計体系",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "所/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
    "isCalculated": false,
  },
  "groupKey": "pharmaceutical-sales-count",
  "seoTitle": "医薬品販売業数ランキング都道府県【2023年】｜1位東京都（4,945所）",
  "seoDescription": "2023年の医薬品販売業数の都道府県別ランキング。1位東京都（4,945所）、最下位鳥取県（243所）で20.3倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
