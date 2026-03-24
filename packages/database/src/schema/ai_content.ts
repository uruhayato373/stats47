import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";


export const rankingAiContent = sqliteTable(
  "ranking_ai_content",
  {
    rankingKey: text("ranking_key").notNull(),
    areaType: text("area_type").notNull(),
    faq: text("faq"),
    regionalAnalysis: text("regional_analysis"),
    insights: text("insights"),
    yearCode: text("year_code").notNull(),
    dataHash: text("data_hash"),
    aiModel: text("ai_model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    generatedAt: text("generated_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rankingKey, table.areaType] }),
    isActiveIdx: index("idx_ranking_ai_content_is_active").on(table.isActive),
  })
);

export type RankingAiContentRow = typeof rankingAiContent.$inferSelect;
export type InsertRankingAiContent = typeof rankingAiContent.$inferInsert;

