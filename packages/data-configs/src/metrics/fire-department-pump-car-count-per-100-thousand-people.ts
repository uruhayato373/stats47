import type { MetricConfig } from "../types";

export const fireDepartmentPumpCarCountPer100ThousandPeople: MetricConfig = {
  "key": "fire-department-pump-car-count-per-100-thousand-people",
  "title": "消防ポンプ自動車等現有数",
  "unit": "台",
  "category": "safetyenvironment",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K01105",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2022,
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
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
        "unit": "台/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "台/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "seoTitle": "消防ポンプ自動車等現有数ランキング都道府県【2022年】｜1位山形県（241.2台）",
  "seoDescription": "2022年の消防ポンプ自動車等現有数の都道府県別ランキング。1位山形県（241.2台）、最下位東京都（27.2台）で8.9倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
