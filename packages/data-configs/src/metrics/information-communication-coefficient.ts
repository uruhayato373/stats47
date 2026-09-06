import type { MetricConfig } from "../types";

export const informationCommunicationCoefficient: MetricConfig = {
  "key": "information-communication-coefficient",
  "title": "情報通信係数",
  "subtitle": "都道府県庁所在市の二人以上世帯の消費支出に占める情報通信関係費（通信料・放送受信料）の割合",
  "note": "分子はインターネット接続料を除く5品目（固定電話・移動電話の通信料、NHK・ケーブルテレビ・他の放送受信料）の合計。全国的に上昇傾向のため、時系列の比較には向かず、同一年の都市間比較に使う",
  "description": "消費支出に占める情報通信関係費の割合（情報通信関係費÷消費支出×100）。エンゲル係数と同じ発想で、通信料と放送受信料という「削りにくい固定費」が家計をどれだけ圧迫しているかを都市間で比べる指標。",
  "unit": "％",
  "category": "ict",
  "source": {
    "kind": "external",
    "fetcherKey": "calculated",
    "config": {},
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
    "minValueType": "data-min",
  },
  "display": {
    "conversionFactor": 1,
    "decimalPlaces": 1,
  },
  "calculation": {
    "isCalculated": true,
    "type": "ratio",
    // 分子・分母とも同一表 (家計調査 家計収支編) の年額なので期間は約分される。
    "scaleFactor": 100,
    "numeratorKey": "information-communication-expenditure",
    "denominatorKey": "consumption-expenditure-total",
  },
  "isActive": true,
};
