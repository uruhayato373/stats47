import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";

/**
 * themes — テーマダッシュボード (/themes/[themeKey]) の構成定義
 *
 * Source of truth は D1。R2 snapshot (`app/themes/[key]/config.json`) に export して
 * web app から fetch する。旧 `packages/types/src/indicator-sets/*.ts` を D1 に移行
 * (PR #TBD, 2026-05-26)。
 *
 * - theme_key: 'living-housing', 'aging-society' 等 (URL の [themeKey] と一致)
 * - usage: 'theme' | 'compare' | 'both' (compare は SNS 比較用)
 * - keywords_json / related_article_tag_keys_json: JSON 配列文字列
 */
export const themes = sqliteTable(
  "themes",
  {
    themeKey: text("theme_key").primaryKey(),
    title: text("title").notNull(),
    description: text("description"),
    category: text("category"),
    usage: text("usage", { enum: ["theme", "compare", "both"] })
      .notNull()
      .default("theme"),
    keywordsJson: text("keywords_json").default("[]"),
    relatedArticleTagKeysJson: text("related_article_tag_keys_json").default("[]"),
    displayOrder: integer("display_order").default(0),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    displayOrderIdx: index("idx_themes_display_order").on(table.displayOrder),
    usageIdx: index("idx_themes_usage").on(table.usage),
    activeIdx: index("idx_themes_active").on(table.isActive),
  })
);

/**
 * theme_metrics — テーマと metric の紐付け + チャート定義
 *
 * 1 metric が同テーマで複数チャートに登場できるよう (theme_key, metric_key, chart_type)
 * を複合 PK にする。例: vacant-housing-ratio を choropleth と line の両方で表示。
 *
 * - panel_label: タブ名 ('住宅' '世帯' 等)。NULL ならタブ無し (テーマ直下)
 * - panel_order: 同タブ内の表示順
 * - role: 'primary' | 'secondary' | 'context' (compare 除外判定等に使用)
 * - chart_type: 'choropleth' | 'line' | 'pie' | 'bar' | 'ranking-table'
 * - chart_target: 'national' (全国推移) | 'prefecture' (47件) | NULL
 * - chart_config_json: pie の breakdown cdCat 等、chart 固有の設定 (JSON)
 */
export const themeMetrics = sqliteTable(
  "theme_metrics",
  {
    themeKey: text("theme_key")
      .notNull()
      .references(() => themes.themeKey),
    metricKey: text("metric_key")
      .notNull()
      .references(() => metrics.key),
    panelLabel: text("panel_label"),
    panelOrder: integer("panel_order").default(0),
    role: text("role", { enum: ["primary", "secondary", "context"] }),
    shortLabel: text("short_label"),
    chartType: text("chart_type", {
      enum: ["choropleth", "line", "pie", "bar", "ranking-table"],
    })
      .notNull()
      .default("choropleth"),
    chartTarget: text("chart_target", { enum: ["national", "prefecture"] }),
    chartConfigJson: text("chart_config_json"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.themeKey, table.metricKey, table.chartType] }),
    themeKeyIdx: index("idx_theme_metrics_theme_key").on(table.themeKey),
    metricKeyIdx: index("idx_theme_metrics_metric_key").on(table.metricKey),
    panelIdx: index("idx_theme_metrics_panel").on(table.themeKey, table.panelLabel, table.panelOrder),
  })
);

export type Theme = typeof themes.$inferSelect;
export type InsertTheme = typeof themes.$inferInsert;
export type ThemeMetric = typeof themeMetrics.$inferSelect;
export type InsertThemeMetric = typeof themeMetrics.$inferInsert;

export const insertThemeSchema = createInsertSchema(themes);
export const selectThemeSchema = createSelectSchema(themes);
export const insertThemeMetricSchema = createInsertSchema(themeMetrics);
export const selectThemeMetricSchema = createSelectSchema(themeMetrics);
