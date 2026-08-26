import type { MetricConfig } from "../types";

export const lateElderlyMedicalExpensePerInsured: MetricConfig = {
  "key": "late-elderly-medical-expense-per-insured",
  "title": "後期高齢者医療費",
  "description": "後期高齢者医療制度の医療費を被保険者1人当たりに換算した金額です。",
  "unit": "円",
  "category": "socialsecurity",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010210",
    "cdCat01": "#J05208",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "years": [
      1996,
      1997,
      1998,
      1999,
      2000,
      2001,
      2002,
      2003,
      2023,
    ],
  },
  "yearFormat": "fiscal",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "data-min",
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
  "seoTitle": "後期高齢者医療費ランキング都道府県【2023年】｜1位福岡県（1,195,147円）",
  "seoDescription": "2023年の後期高齢者医療費の都道府県別ランキング。1位福岡県（1,195,147円）、最下位新潟県（775,287円）で1.5倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
