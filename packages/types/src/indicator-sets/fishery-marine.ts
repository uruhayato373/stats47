// AUTO-GENERATED — DO NOT EDIT.
// Source of truth: packages/data-configs/src/theme-catalog/fishery-marine.ts
// Regenerate: npm run generate:catalog --workspace=@stats47/data-configs
import type { IndicatorSet } from "../indicator-set";

export const FISHERY_MARINE_SET: IndicatorSet = {
  "key": "fishery-marine",
  "title": "漁業（水産業）",
  "description": "都道府県別の漁獲量・養殖収獲量・漁業就業者数・漁業産出額・漁港数をランキングとチャートで比較。北海道が全国漁獲量の約2割を占める一方、半世紀で就業者は7割減・漁獲量はほぼ半減。「捕る漁業」から「育てる漁業」へのシフトを47都道府県のデータで確認できます。",
  "category": "industry",
  "usage": "theme",
  "metrics": [
    {
      "rankingKey": "fish-catch",
      "shortLabel": "漁獲量",
      "role": "primary"
    },
    {
      "rankingKey": "marine-fishery-catch",
      "shortLabel": "海面漁獲量",
      "role": "context"
    },
    {
      "rankingKey": "inland-fishery-catch",
      "shortLabel": "内水面漁獲量",
      "role": "context"
    },
    {
      "rankingKey": "fishing-port-count-ksj",
      "shortLabel": "指定漁港総数",
      "role": "context"
    },
    {
      "rankingKey": "aquaculture-harvest",
      "shortLabel": "養殖収獲量",
      "role": "secondary"
    },
    {
      "rankingKey": "marine-aquaculture-harvest",
      "shortLabel": "海面養殖",
      "role": "context"
    },
    {
      "rankingKey": "inland-aquaculture-harvest",
      "shortLabel": "内水面養殖",
      "role": "context"
    },
    {
      "rankingKey": "marine-fishery-aquaculture-output-value",
      "shortLabel": "産出額（新）",
      "role": "primary"
    },
    {
      "rankingKey": "marine-fishery-output-value",
      "shortLabel": "海面漁業産出額",
      "role": "context"
    },
    {
      "rankingKey": "fishery-output-value",
      "shortLabel": "産出額（旧）",
      "role": "context"
    },
    {
      "rankingKey": "fishery-workers",
      "shortLabel": "漁業就業者",
      "role": "primary"
    },
    {
      "rankingKey": "fishery-species-catch-scallop",
      "shortLabel": "ホタテガイ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-japanese-squid",
      "shortLabel": "スルメイカ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-tuna",
      "shortLabel": "マグロ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-bonito",
      "shortLabel": "カツオ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-mackerel",
      "shortLabel": "サバ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pacific-saury",
      "shortLabel": "サンマ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-yellowtail",
      "shortLabel": "ブリ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sardine",
      "shortLabel": "イワシ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-pollock",
      "shortLabel": "スケトウダラ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-kelp",
      "shortLabel": "コンブ類",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-snow-crab",
      "shortLabel": "ズワイガニ",
      "role": "context"
    },
    {
      "rankingKey": "fishery-species-catch-sea-bream",
      "shortLabel": "タイ類",
      "role": "context"
    }
  ],
  "keywords": [
    "漁業",
    "水産業",
    "漁獲量",
    "養殖",
    "漁業就業者",
    "漁業産出額",
    "漁港",
    "海面漁業",
    "内水面漁業",
    "都道府県",
    "ランキング"
  ],
  "relatedArticleTagKeys": [
    "fishery",
    "fish-catch",
    "aquaculture",
    "fisheries-industry"
  ]
};
