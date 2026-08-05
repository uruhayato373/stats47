import type { CategoryTopicCatalog } from "../types";

/** 国際 (8 件) — すべて在留外国人。国籍・地域別で 1 群 */
export const INTERNATIONAL_TOPICS: CategoryTopicCatalog = {
  categoryKey: "international",
  topics: [
    {
      key: "foreign-residents",
      label: "在留外国人",
      matchers: [{ kind: "title", pattern: "在留外国人|外国人" }],
    },
  ],
};
