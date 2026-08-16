import type { MetricConfig } from "../types";

export const fisheryManagementOrgs: MetricConfig = {
  "key": "fishery-management-orgs",
  "title": "漁業管理組織 延べ組織数（管理対象漁業種類計）",
  "note": "内陸県は調査対象外（0で表示）",
  "unit": "組織",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262285",
    "cdCat01": "100",
    "displayName": "漁業管理組織 延べ組織数（管理対象漁業種類計）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262285",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2003,
    "to": 2003,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "isActive": true,
};
