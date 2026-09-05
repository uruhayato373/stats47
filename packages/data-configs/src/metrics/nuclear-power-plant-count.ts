import type { MetricConfig } from "../types";

export const nuclearPowerPlantCount: MetricConfig = {
  "key": "nuclear-power-plant-count",
  "title": "原子力発電所数",
  "unit": "か所",
  "category": "energy",
  "source": {
    "kind": "external",
    "fetcherKey": "mlit_ksj",
    "config": {
      "source": {
        "name": "国土数値情報",
        "url": "https://nlftp.mlit.go.jp/ksj/index.html",
      },
      "ksjDataId": "P03",
      "ksjVersion": "13",
      "description": "国土数値情報に登録されている原子力発電所の都道府県別数",
    },
    "displayName": "国土数値情報",
    "url": "https://nlftp.mlit.go.jp/ksj/index.html",
  },
  "surveyId": "mlit-ksj",
  "entities": [
    "prefecture",
  ],
  "years": {
    "from": 2013,
    "to": 2013,
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
  // 2026-08-17: 2 つ是正した。(1) 県の帰属を住所ベースにして 1 位が福島県 → 福井県
  // (旧実装は最寄りの県庁所在地で決めており高浜・大飯が京都府に流れていた)。
  // (2) KSJ P03 は号機ごとに 1 レコードなので施設名 + 住所で畳んで「か所」に揃えた
  // (福島県 13 → 3、全国 68 → 21)。
  "seoTitle": "原子力発電所数ランキング都道府県【2013年】｜1位福井県（4か所）",
  "seoDescription": "2013年の原子力発電所数の都道府県別ランキング。1位福井県（4か所）、立地は14都道府県で全国21か所。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
