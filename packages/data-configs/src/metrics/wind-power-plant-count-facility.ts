import type { MetricConfig } from "../types";

export const windPowerPlantCountFacility: MetricConfig = {
  "key": "wind-power-plant-count-facility",
  "title": "風力発電施設数（施設ベース）",
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
      "description": "風力発電施設数（施設ベース）",
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
  // 2026-08-17: 県の帰属を最寄り県庁所在地から属性/空間結合へ是正し値が変わった
  // (KSJ-PREF-ASSIGN-01)。
  "seoTitle": "風力発電施設数（施設ベース）ランキング都道府県【2013年】｜1位北海道（55か所）",
  "seoDescription": "2013年の風力発電施設数（施設ベース）の都道府県別ランキング。1位北海道（55か所）、立地の無い県は7県。地図やグラフで47都道府県を比較。",
  "isActive": false,
};
