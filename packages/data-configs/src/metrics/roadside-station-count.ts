import type { MetricConfig } from "../types";

export const roadsideStationCount: MetricConfig = {
  "key": "roadside-station-count",
  "title": "道の駅数",
  "unit": "か所",
  "category": "tourism",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "P35",
      "ksjVersion": "18",
      "description": "国土数値情報に登録されている道の駅の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2018,
    "to": 2018,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "type": "per_population",
        "label": "人口10万人あたり",
        "unit": "か所/10万人",
        "scaleFactor": 100000,
        "decimalPlaces": 1,
      },
      {
        "type": "per_area",
        "label": "面積100km²あたり",
        "unit": "か所/100km²",
        "scaleFactor": 100,
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "seoTitle": "道の駅数ランキング｜北海道は東京の122倍【2018】",
  "seoDescription": "道の駅の数は都道府県で122倍もの差があります──1位北海道122か所、最下位東京都1か所。車社会と観光の関係、47都道府県の分布を2018年データで比較します。",
  "isActive": true,
};
