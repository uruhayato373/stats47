import type { MetricConfig } from "../types";

export const fireInsuranceClaimsReceivedPer1000Households: MetricConfig = {
  "key": "fire-insurance-claims-received-per-1000-households",
  "title": "火災保険保険金受取件数",
  "unit": "件",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K10304",
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
    "decimalPlaces": 2,
  },
  "calculation": {
    "isCalculated": false,
  },
  "seoTitle": "火災保険住宅物件・一般物件保険金受取件数（1年）",
  "isActive": false,
};
