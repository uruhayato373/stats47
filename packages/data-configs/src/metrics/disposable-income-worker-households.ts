import type { MetricConfig } from "../types";

export const disposableIncomeWorkerHouseholds: MetricConfig = {
  "key": "disposable-income-worker-households",
  "title": "可処分所得（二人以上の世帯のうち勤労者世帯）",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010112",
    "cdCat01": "L3130",
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
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 0.0001,
    "decimalPlaces": 1,
    "displayUnit": "万円",
  },
  "calculation": {
    "isCalculated": false,
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
  },
  "seoTitle": "可処分所得（二人以上の世帯のうち勤労者世帯）ランキング都道府県【2024年】｜1位東京都（637,958円）",
  "seoDescription": "2024年の可処分所得（二人以上の世帯のうち勤労者世帯）の都道府県別ランキング。1位東京都（637,958円）、最下位愛媛県（420,678円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
