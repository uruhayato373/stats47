import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { indicators } from "./indicators";

/**
 * AI 生成コンテンツ — 旧 ranking_ai_content の置換 (PR-5)
 *
 * PK は indicator_id 単独。旧 (ranking_key, area_type) 複合 PK は indicator_id が
 * (key, area_type) を一意に表すため不要。1,943 行全て area_type='prefecture' だった
 * ため、PK 変更時のデータ衝突なし。
 */
export const aiContent = sqliteTable(
  "ai_content",
  {
    indicatorId: integer("indicator_id")
      .primaryKey()
      .references(() => indicators.id),
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
    isActiveIdx: index("idx_ai_content_is_active").on(table.isActive),
    isProofreadIdx: index("idx_ai_content_is_proofread").on(table.isProofread),
  })
);

export type AiContent = typeof aiContent.$inferSelect;
export type InsertAiContent = typeof aiContent.$inferInsert;

export const insertAiContentSchema = createInsertSchema(aiContent);
export const selectAiContentSchema = createSelectSchema(aiContent);
