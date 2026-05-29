import type { MetricConfig } from "../types";

export const fisheryManagementOrgs: MetricConfig = {
  "key": "fishery-management-orgs",
  "title": "漁業管理組織 延べ組織数（管理対象漁業種類計, 2018年）",
  "subtitle": "※ 内陸 8 県 (栃木/群馬/埼玉/山梨/長野/岐阜/滋賀/奈良) は調査対象外 (value=0 で表示)",
  "unit": "組織",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262285",
    "cdCat01": "100",
    "displayName": "漁業管理組織 延べ組織数（管理対象漁業種類計, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262285",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
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
  "isFeatured": false,
  "featuredOrder": 0,
};
