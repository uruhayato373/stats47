import type { MetricConfig } from "../types";

export const goodsInventoryWholesaleRetail: MetricConfig = {
  "key": "goods-inventory-wholesale-retail",
  "title": "商品手持額",
  "unit": "百万円",
  "category": "commercial",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C3505",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2011,
    "to": 2011,
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
  },
  "seoTitle": "商品手持額（卸売業＋小売業）",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
