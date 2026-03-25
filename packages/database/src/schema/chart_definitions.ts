import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

/**
 * チャート定義テーブル
 *
 * e-Stat API パラメータを含むチャート定義を一元管理し、
 * テーマページ・エリアページ・比較ページで共有する。
 */
export const chartDefinitions = sqliteTable(
  "chart_definitions",
  {
    id:             integer("id").primaryKey({ autoIncrement: true }),
    /** ユニークキー（例: "crime-count-arrest-rate-trend"） */
    chartKey:       text("chart_key").unique().notNull(),
    /** チャートタイプ（DashboardComponentRenderer の componentType と同じ） */
    componentType:  text("component_type").notNull(),
    /** チャートタイトル */
    title:          text("title").notNull(),
    /** チャート設定 JSON（componentProps と同形式 — estatParams, labels, unit 等） */
    componentProps: text("component_props").notNull(),
    /** データソース名（出典表示用） */
    sourceName:     text("source_name"),
    /** データソース URL */
    sourceLink:     text("source_link"),
    /** 関連ランキングページへのリンク */
    rankingLink:    text("ranking_link"),
    /** タグ（JSON 文字列配列 — 検索・分類用） */
    tags:           text("tags"),
    /** グリッド幅（12カラムグリッド中の占有数） */
    gridColumnSpan: integer("grid_column_span").default(12),
    /** 有効フラグ */
    isActive:       integer("is_active", { mode: "boolean" }).default(true),
    createdAt:      text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:      text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    chartKeyIdx:     index("idx_chart_definitions_chart_key").on(table.chartKey),
    componentTypeIdx: index("idx_chart_definitions_component_type").on(table.componentType),
  })
);

/**
 * ページ × チャート 割り当てテーブル
 *
 * どのページにどのチャートを表示するかの関連付け。
 * 同じチャートを複数ページで再利用できる。
 */
export const pageChartAssignments = sqliteTable(
  "page_chart_assignments",
  {
    id:        integer("id").primaryKey({ autoIncrement: true }),
    /** ページ種別: "theme" | "area" | "compare" */
    pageType:  text("page_type").notNull(),
    /** ページキー（例: "safety", "13000", "economy"） */
    pageKey:   text("page_key").notNull(),
    /** チャートキー（chart_definitions.chart_key） */
    chartKey:  text("chart_key").notNull(),
    /** 配置セクション（例: "治安", "交通", "main", "sidebar"） */
    section:   text("section"),
    /** 表示順 */
    sortOrder: integer("sort_order").default(0),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pageTypeKeyIdx: index("idx_page_chart_assignments_page").on(table.pageType, table.pageKey),
    chartKeyIdx:    index("idx_page_chart_assignments_chart_key").on(table.chartKey),
    uniqueAssignment: index("idx_page_chart_unique").on(table.pageType, table.pageKey, table.chartKey),
  })
);
