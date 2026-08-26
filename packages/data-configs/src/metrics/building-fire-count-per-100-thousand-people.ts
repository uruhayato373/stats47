import type { MetricConfig } from "../types";

export const buildingFireCountPer100ThousandPeople: MetricConfig = {
  "key": "building-fire-count-per-100-thousand-people",
  "title": "火災出火件数",
  "unit": "件",
  "category": "safetyenvironment",
  "description": "消防統計の出火件数を総人口で除し、人口10万人当たりに換算した値。",
  "note": "基礎値はすべての出火件数であり、建物火災だけに限定した指標ではない。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K02101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2023,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateReds",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
        "unit": "件/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "件/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "火災出火件数ランキング都道府県【2023年】｜1位茨城県（49件）",
  "seoDescription": "2023年の火災出火件数の都道府県別ランキング。1位茨城県（49件）、最下位富山県（17.7件）で2.8倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
