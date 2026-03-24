import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

export const rankingPageCards = sqliteTable(
  "ranking_page_cards",
  {
    id: text("id").primaryKey(),
    rankingKey: text("ranking_key").notNull(),
    componentType: text("component_type").notNull(),
    displayOrder: integer("display_order").default(0),
    title: text("title"),
    componentProps: text("component_props"), // JSON
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    componentTypeCheck: check(
      "ranking_page_cards_component_type_check",
      sql`${table.componentType} IN ('stats-line-chart')`
    ),
    rankingKeyIdx: index("idx_ranking_page_cards_ranking_key").on(
      table.rankingKey
    ),
    displayOrderIdx: index("idx_ranking_page_cards_display_order").on(
      table.displayOrder
    ),
    isActiveIdx: index("idx_ranking_page_cards_is_active").on(
      table.isActive
    ),
  })
);

export type RankingPageCard = typeof rankingPageCards.$inferSelect;
export type InsertRankingPageCard = typeof rankingPageCards.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertRankingPageCardSchema = createInsertSchema(rankingPageCards);
export const selectRankingPageCardSchema = createSelectSchema(rankingPageCards);
