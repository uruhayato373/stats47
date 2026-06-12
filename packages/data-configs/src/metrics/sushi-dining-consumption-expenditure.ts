import type { MetricConfig } from "../types";

export const sushiDiningConsumptionExpenditure: MetricConfig = {
  "key": "sushi-dining-consumption-expenditure",
  "title": "すし(外食)消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間すし(外食)消費支出額",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "011211040",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "外食すし消費額1位がなぜ富山？東京でも大阪でもない北陸の2.5倍格差（2024）",
  "seoDescription": "外食すし消費額の1位は富山県23,185円で、東京・神奈川より高い。北陸が上位を占め、最下位沖縄9,270円との2.5倍差の背景にある食文化とは？47都道府県で可視化（2024年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
