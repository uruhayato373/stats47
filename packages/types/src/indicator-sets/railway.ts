// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: data/themes/catalogs/railway.json
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const RAILWAY_SET: IndicatorSet = {
  "key": "railway",
  "title": "鉄道",
  "description": "JR・民鉄の旅客利用、駅の配置と利用、貨物の規模を分けて把握する。",
  "category": "economy",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "railway-passengers",
      "shortLabel": "鉄道駅乗降客数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-passenger-transport",
      "shortLabel": "JR輸送人員",
      "role": "primary"
    },
    {
      "rankingKey": "private-railway-passenger-transport",
      "shortLabel": "民鉄輸送人員",
      "role": "secondary"
    },
    {
      "rankingKey": "railway-station-count",
      "shortLabel": "鉄道駅数",
      "role": "secondary"
    },
    {
      "rankingKey": "jr-freight-shipment",
      "shortLabel": "JR貨物発送量",
      "role": "context"
    },
    {
      "rankingKey": "commute-by-train",
      "shortLabel": "鉄道・電車通勤通学者数",
      "role": "secondary"
    },
    {
      "rankingKey": "train-commuter-pass-consumption-expenditure",
      "shortLabel": "鉄道通勤定期代",
      "role": "secondary"
    },
    {
      "rankingKey": "train-fare-consumption-expenditure",
      "shortLabel": "鉄道運賃",
      "role": "secondary"
    }
  ],
  "keywords": [
    "鉄道",
    "JR",
    "私鉄",
    "民鉄",
    "駅",
    "乗降客",
    "輸送人員",
    "鉄道貨物"
  ],
  "relatedArticleTagKeys": [
    "鉄道",
    "交通",
    "公共交通"
  ]
};
