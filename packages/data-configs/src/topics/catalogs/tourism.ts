import type { CategoryTopicCatalog } from "../types";

/** 運輸・観光 (49 件) — 旅行の行動者率 / 宿泊 / 旅客・貨物輸送 / 自動車保有 */
export const TOURISM_TOPICS: CategoryTopicCatalog = {
  categoryKey: "tourism",
  topics: [
    {
      key: "travel-activity",
      label: "旅行の行動者率",
      matchers: [{ kind: "title", pattern: "行動者率" }],
    },
    {
      key: "accommodation",
      label: "宿泊",
      matchers: [{ kind: "title", pattern: "宿泊|客室|ホテル|旅館|簡易宿所|道の駅|観光資源" }],
    },
    {
      key: "passenger",
      label: "旅客輸送",
      matchers: [{ kind: "title", pattern: "旅客|輸送人員|乗込|上陸|入港|通勤・通学者数|入国者数" }],
    },
    {
      key: "freight",
      label: "貨物輸送",
      matchers: [{ kind: "title", pattern: "貨物|コンテナ|トン数|フェリー輸送" }],
    },
    {
      key: "vehicle",
      label: "自動車・事業者",
      matchers: [{ kind: "title", pattern: "台数|事業者|自動車" }],
    },
  ],
};
