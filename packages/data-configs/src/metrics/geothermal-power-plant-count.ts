import type { MetricConfig } from "../types";

export const geothermalPowerPlantCount: MetricConfig = {
  "key": "geothermal-power-plant-count",
  "title": "地熱発電施設数",
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
      "description": "地熱発電施設数",
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
  // 2026-08-17: 県の帰属を住所ベースに是正 (八丈島が神奈川県に付き、秋田・福島が 0 だった)。
  // あわせて KSJ P03 の号機単位レコードを施設名 + 住所で畳み「か所」に揃えた (大分県 7 → 6)。
  "seoTitle": "地熱発電施設数ランキング都道府県【2013年】｜1位大分県（6か所）",
  "seoDescription": "2013年の地熱発電施設数の都道府県別ランキング。1位大分県（6か所）、立地は8道県で全国17か所。地図やグラフで47都道府県を比較。",
  "isActive": true,
};
