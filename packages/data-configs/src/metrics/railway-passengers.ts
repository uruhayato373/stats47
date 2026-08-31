import type { MetricConfig } from "../types";

export const railwayPassengers: MetricConfig = {
  "key": "railway-passengers",
  "title": "鉄道駅 乗降客数",
  "description": "国土数値情報「駅別乗降客数」(S12) をもとにした、都道府県内の鉄道駅の1日あたり乗降客数の合計。S12 に乗降客数が登録されている駅のみを集計対象とする。2019〜2023年度。",
  "unit": "人/日",
  "category": "infrastructure",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報 駅別乗降客数",
        "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2023.html",
      },
      "ksjDataId": "S12",
      "ksjVersion": "2023",
      "description": "都道府県内の鉄道駅の1日あたり乗降客数の合計（S12 に乗降客数が登録されている駅）",
    },
    "displayName": "国土数値情報 駅別乗降客数",
    "url": "https://nlftp.mlit.go.jp/ksj/gml/datalist/KsjTmplt-S12-2023.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2019,
    "to": 2023,
  },
  "yearFormat": "fiscal",
  "display": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口1人あたり",
        "unit": "人/日/人",
        "scaleFactor": 1,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  "seoTitle": "鉄道駅 乗降客数ランキング都道府県【2023年度】",
  "seoDescription": "2023年度の鉄道駅 乗降客数（県内合計）の都道府県別ランキング。国土数値情報「駅別乗降客数」をもとに47都道府県を地図とグラフで比較。",
  "isActive": true,
};
