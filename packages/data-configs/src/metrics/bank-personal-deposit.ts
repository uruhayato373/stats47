import type { MetricConfig } from "../types";

export const bankPersonalDeposit: MetricConfig = {
  "key": "bank-personal-deposit",
  "title": "国内銀行個人預金残高",
  "unit": "億円",
  "category": "economy",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010103",
    "cdCat01": "C360211",
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
    "colorScheme": "interpolateGreens",
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
        "unit": "億円/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "億円/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "bank-deposit",
  "seoTitle": "国内銀行個人預金残高ランキング都道府県【2024年】｜1位東京都（1,556,581億円）",
  "seoDescription": "2024年の国内銀行個人預金残高の都道府県別ランキング。1位東京都（1,556,581億円）、最下位鳥取県（19,650億円）で79.2倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
