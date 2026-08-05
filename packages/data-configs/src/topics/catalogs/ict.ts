import type { CategoryTopicCatalog } from "../types";

/** 情報通信・科学技術 (16 件) — 通信サービス / 情報機器の保有 / 利用時間 */
export const ICT_TOPICS: CategoryTopicCatalog = {
  categoryKey: "ict",
  topics: [
    {
      key: "telecom",
      label: "通信サービス",
      matchers: [{ kind: "title", pattern: "電話|郵便局|通信費" }],
    },
    {
      key: "device",
      label: "情報機器の保有",
      matchers: [{ kind: "title", pattern: "所有数量" }],
    },
    {
      key: "media-use",
      label: "メディアの利用",
      matchers: [{ kind: "title", pattern: "平均時間|行動者率|使用者" }],
    },
  ],
};
