import type { MetricConfig } from "../types";

export const sexRatioTotal: MetricConfig = {
  "key": "sex-ratio-total",
  "title": "人口性比",
  "subtitle": "総人口",
  "unit": "‐",
  "category": "population",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010101",
    "cdCat01": "A192002",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2024,
    "to": 2024,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolatePiYG",
    "colorSchemeType": "diverging",
    "divergingMidpoint": "custom",
    "divergingMidpointValue": 100,
    "isReversed": false,
    "isSymmetrized": false,
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "‐/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 2,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "‐/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
      {
        "type": "per_household",
        "label": "1世帯あたり",
        "unit": "‐/世帯",
        "scaleFactor": 1,
        "decimalPlaces": 4,
      },
    ],
  },
  "seoTitle": "人口性比ランキング都道府県【2024年】｜1位茨城県（100.1‐）",
  "seoDescription": "2024年の人口性比の都道府県別ランキング。1位茨城県（100.1‐）、最下位奈良県（88.7‐）で1.1倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
