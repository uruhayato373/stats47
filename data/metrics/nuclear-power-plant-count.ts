import { DEFAULT_METRIC_PRESENTATION } from "./defaults/presentation";
import type { MetricConfig } from "../../packages/data-configs/src/types";

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
  visualization: {
    ...DEFAULT_METRIC_PRESENTATION,
    "colorScheme": "interpolateOranges",
    "colorSchemeType": "sequential",
  },
  "years": {
    "from": 2013,
    "to": 2013,
  },
  "yearFormat": "calendar",
  "calculation": {
    "normalizationOptions": [
      {
        "denominator": { "kind": "population", "per": 100000 },
        "unit": "か所/10万人",
        "decimalPlaces": 1,
      },
      {
        "denominator": { "kind": "area", "per": 100 },
        "unit": "か所/100km²",
        "decimalPlaces": 2,
      },
    ],
    "isCalculated": false,
  },
  // 2026-08-17: 2 つ是正した。(1) 県の帰属を住所ベースにして 1 位が福島県 → 福井県
  // (旧実装は最寄りの県庁所在地で決めており高浜・大飯が京都府に流れていた)。
  // (2) KSJ P03 は号機ごとに 1 レコードなので施設名 + 住所で畳んで「か所」に揃えた
  // (福島県 13 → 3、全国 68 → 21)。
  "isActive": false,
};
