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
  },
  "groupKey": "death-accident",
  "seoTitle": "不慮の事故による死亡者数（人口10万人当たり）ランキング都道府県",
  "seoDescription": "人口10万人当たりの不慮の事故による死亡者数を都道府県別に比較。総数とは区別して、同じ分母の指標で地域差と経年変化を確認できます。",
  "isActive": true,
};
