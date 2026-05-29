import type { MetricConfig } from "../types";

export const fisheryWorkersCoastalOffshore: MetricConfig = {
  "key": "fishery-workers-coastal-offshore",
  "title": "沿岸・沖合・遠洋別漁業就業者数（計, 2018年）",
  "subtitle": "※ 内陸 8 県 (栃木/群馬/埼玉/山梨/長野/岐阜/滋賀/奈良) は調査対象外 (value=0 で表示)",
  "unit": "人",
  "category": "agriculture",
  "source": {
    "kind": "estat",
    "statsDataId": "0003262278",
    "cdCat01": "100",
    "displayName": "沿岸・沖合・遠洋別漁業就業者数（計, 2018年）",
    "url": "https://www.e-stat.go.jp/dbview?sid=0003262278",
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
