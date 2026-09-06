import type { MetricConfig } from "../types";

export const nattoConsumptionExpenditure: MetricConfig = {
  "key": "natto-consumption-expenditure",
  "title": "納豆消費支出額",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間納豆消費支出額",
  "note": "県庁所在市の二人以上世帯の支出額であって購入量ではない。上位は僅差で入れ替わりやすく、対象は県庁所在市のみで県全体の値ではない",
  "unit": "円",
  "category": "economy",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      "cdCat01": "010530030",
      "cdCat02": "03",
    },
    "displayName": "家計調査",
    "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2007,
    "to": 2024,
  },
  "yearFormat": "calendar",
  "visualization": {
    "colorScheme": "interpolateBlues",
    "colorSchemeType": "sequential",
    "minValueType": "zero",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 0,
  },
  "calculation": {
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
    "isCalculated": false,
  },
  "seoTitle": "納豆消費なぜ東北が独占？関西は3倍差の最下位圏・17年で+17%増（2024）",
  "seoDescription": "1位福島7,830円〜最下位和歌山2,627円で3.0倍差。上位10は東北・北関東が独占し、関西以西で急減する食文化の境界線とは？健康志向で全体+17%増の中でも東北が強い理由を47都道府県で解説（2024年）。",
  "isActive": true,
};
