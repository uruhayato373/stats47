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
 * 指標定義 — 旧 ranking_items の置換 (PR-3)
 *
 * (key, area_type) で一意。area_type は 5 種:
 * prefecture / city / national / port / fishing_port
 *
 * - source_id: sources.id への FK (旧 data_source_id 削除済み、階層は parent_source_id で表現)
 * - JSON 列はすべて _json サフィックス
 * - seo_title: 旧 ranking_name の正式名称 (448 行) を migrate 済み
 *
 * 並行運用フェーズ:
 * - PR-3: 本テーブル + 並行 reader 追加。旧 ranking_items は維持
 * - PR-5: 旧 reader を新 reader に切替後、旧 ranking_items を DROP
 */
export const indicators = sqliteTable(
  "indicators",
  {
    id: integer("id").primaryKey(),
    key: text("key").notNull(),
    areaType: text("area_type", {
      enum: ["prefecture", "city", "national", "port", "fishing_port"],
    }).notNull(),
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
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    naturalKeyIdx: uniqueIndex("idx_indicators_natural_key").on(
      table.key,
      table.areaType
    ),
    keyIdx: index("idx_indicators_key").on(table.key),
    areaTypeIdx: index("idx_indicators_area_type").on(table.areaType),
    sourceIdx: index("idx_indicators_source_id").on(table.sourceId),
    categoryIdx: index("idx_indicators_category_key").on(table.categoryKey),
    activeIdx: index("idx_indicators_active").on(table.isActive),
    featuredIdx: index("idx_indicators_featured").on(table.isFeatured),
    groupKeyIdx: index("idx_indicators_group_key").on(table.groupKey),
  })
);

export type Indicator = typeof indicators.$inferSelect;
export type InsertIndicator = typeof indicators.$inferInsert;

export const insertIndicatorSchema = createInsertSchema(indicators);
export const selectIndicatorSchema = createSelectSchema(indicators);
