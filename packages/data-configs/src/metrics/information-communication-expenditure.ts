import type { MetricConfig } from "../types";

export const informationCommunicationExpenditure: MetricConfig = {
  "key": "information-communication-expenditure",
  "title": "情報通信関係費",
  "subtitle": "都道府県庁所在市の二人以上世帯の年間支出額（固定電話通信料・移動電話通信料・NHK放送受信料・ケーブルテレビ受信料・他の受信料の合計）",
  "note": "インターネット接続料は含まない（家計調査の品目分類で通信料と分離されているため）",
  "description": "家計調査（二人以上の世帯）の固定電話通信料、移動電話通信料、NHK放送受信料、ケーブルテレビ受信料、他の受信料の5品目の年間支出額を合算した値。情報通信係数（本項目÷消費支出）の分子。",
  "unit": "円",
  "category": "ict",
  "source": {
    "kind": "kakei-chousa",
    "filter": {
      "source": {
        "name": "家計調査",
        "url": "https://www.e-stat.go.jp/stat-search/files?page=1&layout=datalist&toukei=00200561",
      },
      "statsDataId": "0003348239",
      // 5 品目を合算 (家計調査に「情報通信関係費」の総数コードは無い)
      "axisSum": {
        "axis": "cat01",
        "codes": ["070300020", "070300030", "090441010", "090441020", "090441030"],
      },
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
  "isActive": true,
};
