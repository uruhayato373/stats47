import type { MetricConfig } from "../types";

export const industrialLandPrice: MetricConfig = {
  "key": "industrial-land-price",
  "title": "標準価格（工業地）",
  "unit": "円/m2",
  "category": "miningindustry",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C5405",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "city",
  ],
  "years": {
    "from": 2005,
    "to": 2005,
  },
  "yearFormat": "fiscal",
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/m2/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/m2/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "標準価格（平均価格）（工業地）",
  "isActive": true,
};
