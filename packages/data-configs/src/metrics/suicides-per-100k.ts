import type { MetricConfig } from "../types";

export const suicidesPer100k: MetricConfig = {
  "key": "suicides-per-100k",
  "title": "自殺者数",
  "subtitle": "人口10万人当たり",
  "unit": "人",
  "category": "safetyenvironment",
  "description": "人口動態調査の死因簡単分類で「自殺」に分類された死亡者数を日本人人口で除し、人口10万人当たりに換算した値。",
  "note": "暦年の人口動態統計に基づく死亡率で、分母は総人口ではなく日本人人口である。",
  "source": {
    "kind": "estat",
    "statsDataId": "0000010209",
    "cdCat01": "#I06201",
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
    "divergingMidpoint": "zero",
    "minValueType": "data-min",
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
  "groupKey": "suicide-count",
  "seoTitle": "自殺者数ランキング都道府県【2023年】｜1位和歌山県（21.8人）",
  "seoDescription": "2023年の自殺者数の都道府県別ランキング。1位和歌山県（21.8人）、最下位福井県（13.6人）で1.6倍の格差。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
