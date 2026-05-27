import type { MetricConfig } from "../types";

export const finalEnergyConsumptionPerCapita: MetricConfig = {
  "key": "final-energy-consumption-per-capita",
  "title": "1人当たり最終エネルギー消費量",
  "unit": "GJ",
  "category": "energy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010108",
    "cdCat01": "H5702",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2022,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
    "isCalculated": false,
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "GJ/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "GJ/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "1人当たり最終エネルギー消費量ランキング都道府県【2022年】｜1位大分県（308.84GJ）",
  "seoDescription": "2022年の1人当たり最終エネルギー消費量の都道府県別ランキング。1位大分県（308.84GJ）、最下位埼玉県（63.32GJ）で4.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
  "isFeatured": false,
  "featuredOrder": 0,
};
