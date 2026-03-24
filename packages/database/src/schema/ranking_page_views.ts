import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * ランキングページ PV 日次蓄積テーブル
 *
 * GA4 API から取得した /ranking/{rankingKey} ページの日次 PV を保存する。
 * ranking_key + date の複合 UNIQUE で UPSERT 対応。
 */
export const rankingPageViews = sqliteTable(
  "ranking_page_views",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rankingKey: text("ranking_key").notNull(),
    date: text("date").notNull(), // "2026-03-23" (ISO 形式)
    pageViews: integer("page_views").notNull().default(0),
    activeUsers: integer("active_users").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("ranking_page_views_key_date_unq").on(
      table.rankingKey,
      table.date
    ),
    dateIdx: index("idx_ranking_page_views_date").on(table.date),
    rankingKeyIdx: index("idx_ranking_page_views_ranking_key").on(
      table.rankingKey
    ),
  })
);

export type RankingPageView = typeof rankingPageViews.$inferSelect;
export type InsertRankingPageView = typeof rankingPageViews.$inferInsert;

export const insertRankingPageViewSchema =
  createInsertSchema(rankingPageViews);
export const selectRankingPageViewSchema =
  createSelectSchema(rankingPageViews);
