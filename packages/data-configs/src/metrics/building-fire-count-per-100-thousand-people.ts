import type { MetricConfig } from "../types";

export const buildingFireCountPer100ThousandPeople: MetricConfig = {
  "key": "building-fire-count-per-100-thousand-people",
  "title": "火災出火件数",
  "subtitle": "人口10万人当たり",
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
  },
  "seoTitle": "火災出火件数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの火災出火件数を都道府県別に比較。総数とは区別し、人口規模を揃えて地域差と経年変化を地図やグラフで確認できます。",
  "isActive": true,
};
