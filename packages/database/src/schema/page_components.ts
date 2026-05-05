import { sql } from "drizzle-orm";
import {
  index,
  integer,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { sources } from "./sources";

/**
 * ページコンポーネント定義テーブル（統合版）
 *
 * ページ種別・ページキー・コンポーネント定義を 1 テーブルで管理。
 * 旧 page_component_assignments を統合 (PR #216, 2026-05-05)。
 *
 * chart_key はページ内でユニーク。複数ページに同じチャートを配置する場合は
 * (page_type, page_key) が異なる行として登録する（component_props は重複）。
 */
export const pageComponents = sqliteTable(
  "page_components",
  {
    id:                   integer("id").primaryKey({ autoIncrement: true }),
    /** ページ種別: "theme" | "area" | "area-category" | "city-category" | "ranking" */
    pageType:             text("page_type").notNull(),
    /** ページキー（例: "safety", "13000", "administrativefinancial", "total-fertility-rate"） */
    pageKey:              text("page_key").notNull(),
    /** コンポーネントキー（例: "cmp-safety-crime-trend", "kpi-pop-total"） */
    componentKey:         text("chart_key").notNull(),
    /** 配置セクション（例: "治安", "交通"） */
    section:              text("section"),
    /** 表示順 */
    sortOrder:            integer("sort_order").default(0),
    /** コンポーネントタイプ（DashboardComponentRenderer の componentType と同じ） */
    componentType:        text("component_type").notNull(),
    /** タイトル */
    title:                text("title").notNull(),
    /** 設定 JSON（estatParams, labels, unit, colors 等） */
    componentProps:       text("component_props").notNull(),
    /** データソース名（出典表示用） */
    sourceName:           text("source_name"),
    /** データソース URL */
    sourceLink:           text("source_link"),
    /** 関連ランキングページへのリンク */
    rankingLink:          text("ranking_link"),
    /** タグ（JSON 文字列配列） */
    tags:                 text("tags"),
    /** グリッド幅（12カラム中の占有数） */
    gridColumnSpan:       integer("grid_column_span").default(12),
    /** タブレット時グリッド幅 */
    gridColumnSpanTablet: integer("grid_column_span_tablet"),
    /** モバイル時グリッド幅 */
    gridColumnSpanSm:     integer("grid_column_span_sm"),
    /** データソース種別 */
    dataSource:           text("data_source").default("ranking"),
    /** sources テーブルへの FK */
    sourceId:             text("source_id").references(() => sources.id),
    /** 有効フラグ */
    isActive:             integer("is_active", { mode: "boolean" }).default(true),
    createdAt:            text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:            text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pageIdx:       index("idx_page_components_page").on(table.pageType, table.pageKey),
    uniqueComp:    uniqueIndex("idx_page_components_unique").on(table.pageType, table.pageKey, table.componentKey),
    compTypeIdx:   index("idx_page_components_component_type").on(table.componentType),
    sourceIdIdx:   index("idx_page_components_source_id").on(table.sourceId),
  })
);

export type PageComponent = typeof pageComponents.$inferSelect;
export type InsertPageComponent = typeof pageComponents.$inferInsert;

export const insertPageComponentSchema = createInsertSchema(pageComponents);
export const selectPageComponentSchema = createSelectSchema(pageComponents);
