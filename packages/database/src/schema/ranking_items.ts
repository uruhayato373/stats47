import { sql } from "drizzle-orm";
import {
    index,
    integer,
    primaryKey,
    real,
    sqliteTable,
    text,
    uniqueIndex,
} from "drizzle-orm/sqlite-core";

export const surveys = sqliteTable("surveys", {
  id: text("id").primaryKey(),
  organization: text("organization").notNull(),
  name: text("name").notNull(),
  url: text("url"),
  description: text("description"),
  displayOrder: integer("display_order").default(0),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export type Survey = typeof surveys.$inferSelect;
export type InsertSurvey = typeof surveys.$inferInsert;

export const dataSources = sqliteTable("data_sources", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  adapterType: text("adapter_type").notNull(),
  configSchema: text("config_schema"),
  isActive: integer("is_active", { mode: "boolean" }).default(true),
  baseUrl: text("base_url"),
  linkTemplate: text("link_template"),
  attributionText: text("attribution_text"),
  license: text("license"),
  licenseUrl: text("license_url"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
});

export const rankingItems = sqliteTable(
  "ranking_items",
  {
    rankingKey: text("ranking_key").notNull(),
    areaType: text("area_type", {
      enum: ["prefecture", "city", "national"],
    }).notNull(),
    rankingName: text("ranking_name").notNull(),
    title: text("title").notNull(),
    subtitle: text("subtitle"),
    demographicAttr: text("demographic_attr"),
    normalizationBasis: text("normalization_basis"),
    unit: text("unit").notNull(),
    description: text("description"),
    categoryKey: text("category_key"),
    latestYear: text("latest_year"), // JSON
    availableYears: text("available_years"), // JSON
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    isFeatured: integer("is_featured", { mode: "boolean" }).default(false),
    featuredOrder: integer("featured_order").default(0),
    dataSourceId: text("data_source_id")
      .default("estat")
      .notNull()
      .references(() => dataSources.id),
    surveyId: text("survey_id").references(() => surveys.id),
    sourceConfig: text("source_config"), // JSON
    valueDisplayConfig: text("value_display_config"), // JSON
    visualizationConfig: text("visualization_config"), // JSON
    calculationConfig: text("calculation_config"), // JSON
    groupKey: text("group_key"),
    additionalCategories: text("additional_categories"), // JSON array: '["infrastructure"]'
    seoTitle: text("seo_title"),
    seoDescription: text("seo_description"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({ columns: [table.rankingKey, table.areaType] }),
    isActiveIdx: index("idx_ranking_items_active").on(table.isActive),
    areaTypeIdx: index("idx_ranking_items_area_type").on(table.areaType),
    categoryKeyIdx: index("idx_ranking_items_category_key").on(table.categoryKey),
    groupKeyIdx: index("idx_ranking_items_group_key").on(table.groupKey),
  })
);

export const rankingData = sqliteTable("ranking_data", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  areaType: text("area_type").notNull(),
  areaCode: text("area_code").notNull(),
  areaName: text("area_name").notNull(),
  yearCode: text("year_code").notNull(),
  yearName: text("year_name"),
  categoryCode: text("category_code").notNull(),
  categoryName: text("category_name"),
  value: real("value").notNull(),
  unit: text("unit"),
  rank: integer("rank"),
  createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
}, (table) => ({
  unq: uniqueIndex("ranking_data_unq").on(
    table.areaType,
    table.categoryCode,
    table.yearCode,
    table.areaCode
  ),
  lookupIdx: index("idx_ranking_data_lookup").on(
    table.areaType,
    table.categoryCode,
    table.yearCode
  ),
  areaIdx: index("idx_ranking_data_area").on(table.areaCode, table.yearCode),
}));

export type DataSource = typeof dataSources.$inferSelect;
export type InsertDataSource = typeof dataSources.$inferInsert;

export type RankingItem = typeof rankingItems.$inferSelect;
export type InsertRankingItem = typeof rankingItems.$inferInsert;

export type RankingData = typeof rankingData.$inferSelect;
export type InsertRankingData = typeof rankingData.$inferInsert;

import { foreignKey } from "drizzle-orm/sqlite-core";
import { tags } from "./tags";

export const rankingTags = sqliteTable(
  "ranking_tags",
  {
    rankingKey: text("ranking_key").notNull(),
    areaType: text("area_type").notNull(),
    tagKey: text("tag_key")
      .notNull()
      .references(() => tags.tagKey),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.rankingKey, table.areaType, table.tagKey],
    }),
    parentFk: foreignKey({
      columns: [table.rankingKey, table.areaType],
      foreignColumns: [rankingItems.rankingKey, rankingItems.areaType],
    }).onDelete("cascade"),
    tagKeyIdx: index("idx_ranking_tags_tag_key").on(table.tagKey),
    rankingIdx: index("idx_ranking_tags_ranking").on(
      table.rankingKey,
      table.areaType
    ),
  })
);

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertDataSourceSchema = createInsertSchema(dataSources);
export const selectDataSourceSchema = createSelectSchema(dataSources);

export const insertRankingItemSchema = createInsertSchema(rankingItems);
export const selectRankingItemSchema = createSelectSchema(rankingItems);

export const insertRankingDataSchema = createInsertSchema(rankingData);
export const selectRankingDataSchema = createSelectSchema(rankingData);

export const insertRankingTagSchema = createInsertSchema(rankingTags);
export const selectRankingTagSchema = createSelectSchema(rankingTags);

export type InsertRankingTag = typeof rankingTags.$inferInsert;
export type RankingTag = typeof rankingTags.$inferSelect;


