import type { CategoryTopicCatalog } from "../types";

/** 鉱工業 (10 件) — 製造業の規模 / 工業地の地価 */
export const MININGINDUSTRY_TOPICS: CategoryTopicCatalog = {
  categoryKey: "miningindustry",
  topics: [
    {
      key: "manufacturing",
      label: "製造業の規模",
      matchers: [{ kind: "title", pattern: "製造品出荷額|製造業|売上金額|付加価値" }],
    },
    {
      key: "industrial-land",
      label: "工業地の地価",
      matchers: [{ kind: "title", pattern: "標準価格" }],
    },
  ],
};
