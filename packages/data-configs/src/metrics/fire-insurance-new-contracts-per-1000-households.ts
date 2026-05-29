import type { MetricConfig } from "../types";

export const fireInsuranceNewContractsPer1000Households: MetricConfig = {
  "key": "fire-insurance-new-contracts-per-1000-households",
  "title": "火災保険新契約件数",
  "unit": "件",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10301",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2016,
    "to": 2016,
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
  },
  "seoTitle": "火災保険住宅物件・一般物件新契約件数（1年）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
