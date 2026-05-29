import type { MetricConfig } from "../types";

export const fireInsuranceAmountReceivedPerContract: MetricConfig = {
  "key": "fire-insurance-amount-received-per-contract",
  "title": "火災保険受取保険金額",
  "unit": "万円",
  "category": "construction",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10305",
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
  "seoTitle": "火災保険住宅物件・一般物件受取保険金額（1年）",
  "isActive": false,
  "isFeatured": false,
  "featuredOrder": 0,
};
