import type { MetricConfig } from "../types";

export const retailGoodsInventoryAmount: MetricConfig = {
  "key": "retail-goods-inventory-amount",
  "title": "小売業商品手持額",
  "unit": "百万円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C350502",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm"
  },
  "entities": [
    "prefecture",
  ],
  "years": "all",
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolatePurples",
    "colorSchemeType": "sequential",
    "minValueType": "data-min"
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口1人あたり",
        "unit": "百万円/人",
        "scaleFactor": 1,
        "decimalPlaces": 2
      }
    ]
  },
  "isActive": true,
};
