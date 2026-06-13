import type { MetricConfig } from "../types";

export const chickenConsumptionQuantity: MetricConfig = {
  "key": "chicken-consumption-quantity",
  "title": "鶏肉消費量",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間鶏肉消費量",
  "unit": "g",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348235",
      "cdCat01": "010310030",
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
        "unit": "g/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "g/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "なぜ島根が鶏肉消費1位？東北・九州・東海が上位圏、関東が最下位の1.9倍格差（2024）",
  "seoDescription": "鶏肉消費量1位は島根県（24,769g）、最下位は茨城県（12,994g）で1.9倍差。地鶏文化・食文化圏ごとの消費パターンを47都道府県ランキングで解説（2024年）。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
