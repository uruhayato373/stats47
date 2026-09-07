import type { MetricConfig } from "../types";

export const cultureRecreationExpenditureTotal: MetricConfig = {
  "key": "culture-recreation-expenditure-total",
  "title": "教養娯楽費",
  "subtitle": "都道府県庁所在市の二人以上世帯の1世帯当たり年間教養娯楽費（教養娯楽用耐久財・書籍・月謝・旅行などへの支出総額）",
  "description": "家計調査（二人以上世帯）における年間の教養娯楽への支出総額。教養娯楽用耐久財、教養娯楽用品、書籍・他の印刷物、教養娯楽サービス（旅行・月謝等）を含む。",
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
      "cdCat01": "090000000",
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
    // 1世帯当たりの年間支出額。県人口・面積で再除算しない。
    "isCalculated": false,
  },
  "isActive": true,
};
