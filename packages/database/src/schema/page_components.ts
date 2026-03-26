import { sql } from "drizzle-orm";
import {
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";

/**
 * ページコンポーネント定義テーブル（Single Source of Truth）
 *
 * KPI カード・チャート・属性マトリクス等、全てのダッシュボードコンポーネントを一元管理。
 * テーマページ・エリアページ・比較ページで共有する。
 *
 * 旧 chart_definitions / comparison_components を統合。
 */
export const pageComponents = sqliteTable(
  "page_components",
  {
    id:             integer("id").primaryKey({ autoIncrement: true }),
    /** ユニークキー（例: "cmp-safety-crime-trend", "kpi-pop-total"） */
    componentKey:   text("chart_key").unique().notNull(),
    /** コンポーネントタイプ（DashboardComponentRenderer の componentType と同じ） */
    componentType:  text("component_type").notNull(),
    /** タイトル */
    title:          text("title").notNull(),
    /** 設定 JSON（componentProps — estatParams, labels, unit, colors 等） */
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
    /** タブレット時グリッド幅 */
    gridColumnSpanTablet: integer("grid_column_span_tablet"),
    /** モバイル時グリッド幅 */
    gridColumnSpanSm: integer("grid_column_span_sm"),
    /** データソース種別 */
    dataSource:     text("data_source").default("ranking"),
    /** 有効フラグ */
    isActive:       integer("is_active", { mode: "boolean" }).default(true),
    createdAt:      text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt:      text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    componentKeyIdx:  index("idx_page_components_component_key").on(table.componentKey),
    componentTypeIdx: index("idx_page_components_component_type").on(table.componentType),
  })
);

/**
 * ページ × コンポーネント 割り当てテーブル
 *
 * どのページにどのコンポーネントを表示するかの関連付け。
 * 同じコンポーネントを複数ページで再利用できる。
 */
export const pageComponentAssignments = sqliteTable(
  "page_component_assignments",
  {
    id:           integer("id").primaryKey({ autoIncrement: true }),
    /** ページ種別: "theme" | "area" | "area-category" */
    pageType:     text("page_type").notNull(),
    /** ページキー（例: "safety", "13000", "safetyenvironment"） */
    pageKey:      text("page_key").notNull(),
    /** コンポーネントキー（page_components.chart_key） */
    componentKey: text("chart_key").notNull(),
    /** 配置セクション（例: "治安", "交通"） */
    section:      text("section"),
    /** 表示順 */
    sortOrder:    integer("sort_order").default(0),
    createdAt:    text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pageTypeKeyIdx:   index("idx_page_component_assignments_page").on(table.pageType, table.pageKey),
    componentKeyIdx:  index("idx_page_component_assignments_component_key").on(table.componentKey),
    uniqueAssignment: index("idx_page_component_unique").on(table.pageType, table.pageKey, table.componentKey),
  })
);
