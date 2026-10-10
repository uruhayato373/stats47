import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
    "years": [
      1976,
      1979,
      1982,
      1985,
      1988,
      1991,
      1994,
      1997,
      2002,
      2007,
      2011,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
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
};
