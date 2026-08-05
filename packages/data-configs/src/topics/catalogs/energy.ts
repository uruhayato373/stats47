import type { CategoryTopicCatalog } from "../types";

/** エネルギー・水 (21 件) — 発電 / 消費 / 都市ガス */
export const ENERGY_TOPICS: CategoryTopicCatalog = {
  categoryKey: "energy",
  topics: [
    {
      key: "power-generation",
      label: "発電",
      matchers: [{ kind: "title", pattern: "発電" }],
    },
    {
      key: "consumption",
      label: "エネルギー消費",
      matchers: [{ kind: "title", pattern: "消費量|需要量|販売量|電力" }],
    },
    {
      key: "gas",
      label: "都市ガス",
      matchers: [{ kind: "title", pattern: "ガス" }],
    },
    {
      key: "water-use",
      label: "工業用水・処理",
      matchers: [{ kind: "title", pattern: "用水|処理場|下水道" }],
    },
  ],
};
