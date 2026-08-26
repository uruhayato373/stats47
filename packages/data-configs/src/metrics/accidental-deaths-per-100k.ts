import type { MetricConfig } from "../types";

export const accidentalDeathsPer100k: MetricConfig = {
  "key": "accidental-deaths-per-100k",
  "title": "不慮の事故による死亡者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "population",
  "description": "人口動態調査の死因簡単分類で「不慮の事故」に分類された死亡者数を総人口で除し、人口10万人当たりに換算した値。",
  "note": "暦年の人口動態統計に基づく死因別死亡率であり、事故の発生件数ではなく死亡者数を測る。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010211",
    "cdCat01": "#K08101",
    "displayName": "社会・人口統計体系",
    "url": "https://www.stat.go.jp/data/ssds/index.htm",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 1975,
    "to": 2023,
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
        "unit": "人/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "人/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
  },
  "groupKey": "death-accident",
  "seoTitle": "不慮の事故による死亡者数ランキング都道府県【2023年】｜1位青森県（60.7人）",
  "seoDescription": "2023年の不慮の事故による死亡者数の都道府県別ランキング。1位青森県（60.7人）、最下位沖縄県（20.2人）で3.0倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
