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
import { surveys } from "./surveys";

/**
 * メトリクス定義 — 統計指標の定義 (key が単独一意キー)
 *
 * area_type は observations に持つ属性のため metrics からは削除済み。
 * - source_id: sources.id への FK
 * - JSON 列はすべて _json サフィックス
 * - 値は observations(metric_key) に格納、年度は observations から動的計算
 *
 * 旧名 indicators (PR #210, 2026-05-04 リネーム — "indicators" は汎用的すぎたため)。
 */
export const metrics = sqliteTable(
  "metrics",
  {
    id: integer("id").primaryKey(),
    key: text("key").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    description: text("description"),
    unit: text("unit").notNull(),
    sourceId: text("source_id").references(() => sources.id),
    surveyId: text("survey_id").references(() => surveys.id),
    categoryKey: text("category_key"),
    visualizationPreset: text("visualization_preset"),
    visualizationConfigJson: text("visualization_config_json"),
    sourceConfigJson: text("source_config_json"),
    valueDisplayConfigJson: text("value_display_config_json"),
    calculationConfigJson: text("calculation_config_json"),
    groupKey: text("group_key"),
    additionalCategoriesJson: text("additional_categories_json"),
    demographicAttr: text("demographic_attr"),
    normalizationBasis: text("normalization_basis"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
    featuredOrder: integer("featured_order").default(0),
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    yearFormat: text("year_format", {
      enum: ["fiscal", "calendar", "plain"],
    })
      .notNull()
      .default("fiscal"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    naturalKeyIdx: uniqueIndex("idx_metrics_natural_key").on(table.key),
    keyIdx: index("idx_metrics_key").on(table.key),
    sourceIdx: index("idx_metrics_source_id").on(table.sourceId),
    categoryIdx: index("idx_metrics_category_key").on(table.categoryKey),
    activeIdx: index("idx_metrics_active").on(table.isActive),
    featuredIdx: index("idx_metrics_featured").on(table.isFeatured),
    groupKeyIdx: index("idx_metrics_group_key").on(table.groupKey),
  })
);

export type Metric = typeof metrics.$inferSelect;
export type InsertMetric = typeof metrics.$inferInsert;

export const insertMetricSchema = createInsertSchema(metrics);
export const selectMetricSchema = createSelectSchema(metrics);
