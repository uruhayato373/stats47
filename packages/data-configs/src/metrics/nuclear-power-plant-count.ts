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
  // 2026-08-17: 県の帰属を住所ベースに是正し 1 位が福島県 → 福井県に変わった
  // (旧実装は最寄りの県庁所在地で帰属を決めており、高浜・大飯が京都府に流れていた)。
  // 件数は本文に書かない — KSJ P03 のレコードは号機単位で、unit「か所」と一致しない
  // 問題が別に残っているため (`docs/todo/05_機能バックログ.md` の KSJ-PREF-ASSIGN-01)。
  "seoTitle": "原子力発電所数ランキング都道府県【2013年】｜1位は福井県",
  "seoDescription": "2013年の原子力発電所数の都道府県別ランキング。1位は福井県で、立地は15都道府県に限られる。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
