import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

/**
 * metrics に紐づく AI 生成テキストコンテンツ
 *
 * PK は metric_key (TEXT)。
 * 旧テーブル名: ai_content (2026-05-05 に metric_texts へリネーム)
 */
export const metricTexts = sqliteTable(
  "metric_texts",
  {
    metricKey: text("metric_key")
      .primaryKey()
      .references(() => metrics.key),
    yearCode: text("year_code").notNull(),
    faq: text("faq"),
    regionalAnalysis: text("regional_analysis"),
    insights: text("insights"),
    aiModel: text("ai_model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    generatedAt: text("generated_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    /**
     * 人間校正済みフラグ (T2-RANK-EDIT-01 より継承)
     * AI 生成 insights/regionalAnalysis を人間がレビュー・補正した場合 true。
     */
    isProofread: integer("is_proofread", { mode: "boolean" }).default(false),
    proofreadAt: text("proofread_at"),
    /** "ai-generated" | "human-authored" | "human-reviewed" */
    editorialSource: text("editorial_source").default("ai-generated"),
    reviewedBy: text("reviewed_by"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    isActiveIdx: index("idx_metric_texts_is_active").on(table.isActive),
    isProofreadIdx: index("idx_metric_texts_is_proofread").on(table.isProofread),
  })
);

export type MetricText = typeof metricTexts.$inferSelect;
export type InsertMetricText = typeof metricTexts.$inferInsert;

export const insertMetricTextSchema = createInsertSchema(metricTexts);
export const selectMetricTextSchema = createSelectSchema(metricTexts);
