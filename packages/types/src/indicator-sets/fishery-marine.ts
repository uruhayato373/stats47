import type { IndicatorSet } from "../indicator-set";

/**
 * 漁業（水産業）テーマ
 *
 * ストーリー軸:
 *  - 北海道 1 県で全国漁獲量の約 2 割を占める「漁業大国」
 *  - 半世紀で漁業就業者は約 7 割減、漁獲量はピーク比でほぼ半減
 *  - 「捕る漁業」から「育てる漁業（養殖）」へのシフト
 *
 * シリーズ構成:
 *  - 漁獲量（C3121 / 1975-2023）+ 内訳（海面 C312101 / 内水面 C312102）
 *  - 養殖収獲量（C3122 / 2000-2023）+ 内訳（海面 C312201 / 内水面 C312202）
 *  - 漁業産出額: 旧シリーズ（C3120, 〜2016）と
 *    新シリーズ「海面漁業・養殖業産出額」（C31201, 2017-）が併存
 *  - 漁業就業者数（C3125 / 1975-2023）
 *  - 漁港数（国土数値情報 / Tier B 既登録）
 */
export const FISHERY_MARINE_SET: IndicatorSet = {
  key: "fishery-marine",
  title: "漁業（水産業）",
  description:
    "都道府県別の漁獲量・養殖収獲量・漁業就業者数・漁業産出額・漁港数を地図とランキングで比較。北海道が全国漁獲量の約2割を占める一方、半世紀で就業者は7割減・漁獲量はほぼ半減。「捕る漁業」から「育てる漁業」へのシフトを47都道府県のデータで確認できます。",
  category: "industry",
  usage: "theme",
  indicators: [
    // 漁獲（捕る漁業）
    { rankingKey: "fish-catch", shortLabel: "漁獲量", role: "primary" },
    { rankingKey: "marine-fishery-catch", shortLabel: "海面漁獲量", role: "secondary" },
    { rankingKey: "inland-fishery-catch", shortLabel: "内水面漁獲量", role: "secondary" },
    { rankingKey: "fishing-port-count-ksj", shortLabel: "漁港数", role: "context" },
    // 養殖（育てる漁業）
    { rankingKey: "aquaculture-harvest", shortLabel: "養殖収獲量", role: "secondary" },
    { rankingKey: "marine-aquaculture-harvest", shortLabel: "海面養殖", role: "secondary" },
    { rankingKey: "inland-aquaculture-harvest", shortLabel: "内水面養殖", role: "secondary" },
    // 経済（産出額）
    {
      rankingKey: "marine-fishery-aquaculture-output-value",
      shortLabel: "産出額（新）",
      role: "primary",
    },
    {
      rankingKey: "marine-fishery-output-value",
      shortLabel: "海面漁業産出額",
      role: "secondary",
    },
    { rankingKey: "fishery-output-value", shortLabel: "産出額（旧）", role: "context" },
    // 雇用
    { rankingKey: "fishery-workers", shortLabel: "漁業就業者", role: "primary" },
    // 魚種別漁獲量（海面漁業生産統計調査 0003238633、1956-2015、40都道府県）
    { rankingKey: "fishery-species-catch-scallop", shortLabel: "ホタテガイ", role: "secondary" },
    {
      rankingKey: "fishery-species-catch-japanese-squid",
      shortLabel: "スルメイカ",
      role: "secondary",
    },
    { rankingKey: "fishery-species-catch-tuna", shortLabel: "マグロ類", role: "secondary" },
    { rankingKey: "fishery-species-catch-bonito", shortLabel: "カツオ", role: "secondary" },
    { rankingKey: "fishery-species-catch-mackerel", shortLabel: "サバ類", role: "context" },
    {
      rankingKey: "fishery-species-catch-pacific-saury",
      shortLabel: "サンマ",
      role: "context",
    },
    { rankingKey: "fishery-species-catch-yellowtail", shortLabel: "ブリ類", role: "context" },
    { rankingKey: "fishery-species-catch-sardine", shortLabel: "イワシ類", role: "context" },
    { rankingKey: "fishery-species-catch-pollock", shortLabel: "スケトウダラ", role: "context" },
    { rankingKey: "fishery-species-catch-kelp", shortLabel: "コンブ類", role: "context" },
    { rankingKey: "fishery-species-catch-snow-crab", shortLabel: "ズワイガニ", role: "context" },
    { rankingKey: "fishery-species-catch-sea-bream", shortLabel: "タイ類", role: "context" },
  ],
  panelTabs: [
    {
      label: "漁獲",
      rankingKeys: [
        "fish-catch",
        "marine-fishery-catch",
        "inland-fishery-catch",
        "fishing-port-count-ksj",
      ],
    },
    {
      label: "養殖",
      rankingKeys: [
        "aquaculture-harvest",
        "marine-aquaculture-harvest",
        "inland-aquaculture-harvest",
      ],
    },
    {
      label: "経済",
      rankingKeys: [
        "marine-fishery-aquaculture-output-value",
        "marine-fishery-output-value",
        "fishery-output-value",
      ],
    },
    {
      label: "雇用",
      rankingKeys: ["fishery-workers"],
    },
    {
      label: "推移",
      rankingKeys: ["fish-catch", "fishery-workers"],
    },
    {
      label: "魚種別",
      rankingKeys: [
        "fishery-species-catch-scallop",
        "fishery-species-catch-japanese-squid",
        "fishery-species-catch-tuna",
        "fishery-species-catch-bonito",
        "fishery-species-catch-mackerel",
        "fishery-species-catch-pacific-saury",
        "fishery-species-catch-yellowtail",
        "fishery-species-catch-sardine",
        "fishery-species-catch-pollock",
        "fishery-species-catch-kelp",
        "fishery-species-catch-snow-crab",
        "fishery-species-catch-sea-bream",
      ],
    },
  ],
  keywords: [
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
    "ランキング",
  ],
  relatedArticleTagKeys: [
    "fishery",
    "fish-catch",
    "aquaculture",
    "fisheries-industry",
  ],
};
