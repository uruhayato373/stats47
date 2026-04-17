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
    aiModel: text("ai_model").notNull(),
    promptVersion: text("prompt_version").notNull(),
    generatedAt: text("generated_at").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    /**
     * 人間校正済みフラグ（T2-RANK-EDIT-01）
     *
     * AI 生成した insights/regionalAnalysis を人間がレビュー・補正した場合 true にする。
     * page.tsx 側で true のエディトリアルは「監修済み」表示・上部優先配置する。
     * Google E-E-A-T 評価向上と、Google の自動重複判定（重複 user canonical 無し 517 件）の回避を狙う。
     */
    isProofread: integer("is_proofread", { mode: "boolean" }).default(false),
    /** 人間校正完了日時（ISO 8601） */
    proofreadAt: text("proofread_at"),
    /** エディトリアル出典: "ai-generated" | "human-authored" | "human-reviewed" */
    editorialSource: text("editorial_source").default("ai-generated"),
    /** 校正者識別子（運営者 ID or ペンネーム。例: "KAZU"） */
    reviewedBy: text("reviewed_by"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rankingKey, table.areaType] }),
    isActiveIdx: index("idx_ranking_ai_content_is_active").on(table.isActive),
    isProofreadIdx: index("idx_ranking_ai_content_is_proofread").on(table.isProofread),
  })
);

export type RankingAiContentRow = typeof rankingAiContent.$inferSelect;
export type InsertRankingAiContent = typeof rankingAiContent.$inferInsert;

