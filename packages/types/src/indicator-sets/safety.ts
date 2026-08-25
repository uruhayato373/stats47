// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/safety.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const SAFETY_SET: IndicatorSet = {
  "key": "safety",
  "title": "安全",
  "description": "都道府県別の犯罪率・検挙率・交通事故・火災件数・自殺率をランキングとチャートで比較。治安・交通・火災・災害・事故の25指標を47都道府県で確認できます。",
  "category": "safety",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "penal-code-offenses-recognized-per-1000",
      "shortLabel": "犯罪率",
      "role": "primary"
    },
    {
      "rankingKey": "serious-crime-per-100k",
      "shortLabel": "凶悪犯",
      "role": "primary"
    },
    {
      "rankingKey": "criminal-recognition-count",
      "shortLabel": "認知件数",
      "role": "context"
    },
    {
      "rankingKey": "violent-crime-per-100k",
      "shortLabel": "粗暴犯",
      "role": "context"
    },
    {
      "rankingKey": "criminal-arrest-rate",
      "shortLabel": "検挙率",
      "role": "secondary"
    },
    {
      "rankingKey": "intellectual-crime-per-100k",
      "shortLabel": "知能犯",
      "role": "context"
    },
    {
      "rankingKey": "theft-offenses-recognized-per-1000",
      "shortLabel": "窃盗率",
      "role": "context"
    },
    {
      "rankingKey": "theft-criminal-arrest-rate",
      "shortLabel": "窃盗検挙率",
      "role": "context"
    },
    {
      "rankingKey": "juvenile-criminal-arrest-person-per-population",
      "shortLabel": "少年犯罪率",
      "role": "context"
    },
    {
      "rankingKey": "drug-enforcement-arrest-count-per-population",
      "shortLabel": "薬物検挙",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100k",
      "shortLabel": "交通死者",
      "role": "primary"
    },
    {
      "rankingKey": "traffic-accident-count-per-population",
      "shortLabel": "交通事故率",
      "role": "secondary"
    },
    {
      "rankingKey": "traffic-accident-count",
      "shortLabel": "事故件数",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-deaths-per-100-accidents",
      "shortLabel": "致死率",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-injuries-per-100k",
      "shortLabel": "負傷者率",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-casualties-elderly-65plus",
      "shortLabel": "高齢者事故",
      "role": "context"
    },
    {
      "rankingKey": "building-fire-count-per-100-thousand-people",
      "shortLabel": "火災",
      "role": "secondary"
    },
    {
      "rankingKey": "fire-deaths-per-100k",
      "shortLabel": "火災死者",
      "role": "context"
    },
    {
      "rankingKey": "fire-damage-casualties-per-population",
      "shortLabel": "火災被害",
      "role": "context"
    },
    {
      "rankingKey": "annual-emergency-dispatches-per-1000",
      "shortLabel": "救急出動",
      "role": "context"
    },
    {
      "rankingKey": "disaster-damage-amount-per-person",
      "shortLabel": "災害被害額",
      "role": "context"
    },
    {
      "rankingKey": "suicide-rate-per-100k",
      "shortLabel": "自殺率",
      "role": "secondary"
    },
    {
      "rankingKey": "suicides-per-100k",
      "shortLabel": "自殺者数",
      "role": "context"
    },
    {
      "rankingKey": "accidental-deaths-per-100k",
      "shortLabel": "事故死",
      "role": "secondary"
    },
    {
      "rankingKey": "police-officer-count-per-population",
      "shortLabel": "警察官数",
      "role": "context"
    },
    {
      "rankingKey": "traffic-accident-injuries",
      "shortLabel": "交通事故負傷者数",
      "role": "context"
    }
  ],
  "keywords": [
    "犯罪",
    "刑法犯",
    "凶悪犯",
    "治安",
    "交通事故",
    "死者数",
    "火災",
    "救急",
    "災害",
    "自殺",
    "都道府県",
    "ランキング"
  ]
};
