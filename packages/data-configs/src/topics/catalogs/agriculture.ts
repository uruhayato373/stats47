import type { CategoryTopicCatalog } from "../types";

/** 農林水産業 (60 件) — 魚種別漁獲量 18 件が最大の塊 */
export const AGRICULTURE_TOPICS: CategoryTopicCatalog = {
  categoryKey: "agriculture",
  topics: [
    {
      key: "catch-by-species",
      label: "魚種別の漁獲量",
      matchers: [{ kind: "title", pattern: "漁獲量|収獲量|養殖" }],
    },
    {
      key: "fishery",
      label: "漁業の経営・港",
      matchers: [{ kind: "title", pattern: "漁業|漁港|漁船|漁家" }],
    },
    {
      key: "farm-output",
      label: "農業の産出額",
      matchers: [{ kind: "title", pattern: "産出額|生産量|生産額|販売金額|6次産業" }],
    },
    {
      key: "farmland",
      label: "農地・森林",
      matchers: [{ kind: "title", pattern: "耕地|農地|田|畑|森林|林野" }],
    },
    {
      key: "farm-worker",
      label: "農林業の従事者",
      matchers: [{ kind: "title", pattern: "農業従事者|経営体|農家|出稼者|林業" }],
    },
    {
      key: "livestock",
      label: "畜産",
      matchers: [{ kind: "title", pattern: "飼養|乳用牛|肉用牛|豚|鶏" }],
    },
  ],
};
