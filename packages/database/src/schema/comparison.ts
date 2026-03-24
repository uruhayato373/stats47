import { sql } from "drizzle-orm";
import {
    check,
    index,
    integer,
    sqliteTable,
    text,
} from "drizzle-orm/sqlite-core";
import { categories } from "./categories";

export const comparisonComponents = sqliteTable(
  "comparison_components",
  {
    id: text("id").primaryKey(),
    categoryKey: text("category_key")
      .notNull()
      .references(() => categories.categoryKey, { onDelete: "cascade" }),
    componentType: text("component_type").notNull(),
    displayOrder: integer("display_order").default(0),
    gridColumnSpan: integer("grid_column_span").default(6),
    gridColumnSpanTablet: integer("grid_column_span_tablet"),
    gridColumnSpanSm: integer("grid_column_span_sm"),
    title: text("title"),
    componentProps: text("component_props"), // JSON
    rankingLink: text("ranking_link"),
    sectionLabel: text("section_label"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    sourceLink: text("source_link"),
    sourceName: text("source_name"),
    areaType: text("area_type", {
      enum: ["prefecture", "city"],
    })
      .notNull()
      .default("prefecture"),
    dataSource: text("data_source").default("ranking"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    componentTypeCheck: check(
      "comparison_components_component_type_check",
      sql`${table.componentType} IN ('kpi-card', 'bar-chart', 'line-chart', 'radar-chart', 'multi-stats-card', 'stats-table', 'stacked-area', 'bar-chart-race', 'mixed-chart', 'diverging-bar-chart', 'attribute-matrix', 'ranking-chart', 'pyramid-chart', 'composition-chart')`
    ),
    gridColumnSpanCheck: check(
      "comparison_components_grid_column_span_check",
      sql`${table.gridColumnSpan} BETWEEN 1 AND 12`
    ),
    gridColumnSpanTabletCheck: check(
      "comparison_components_grid_column_span_tablet_check",
      sql`${table.gridColumnSpanTablet} IS NULL OR ${table.gridColumnSpanTablet} BETWEEN 1 AND 12`
    ),
    gridColumnSpanSmCheck: check(
      "comparison_components_grid_column_span_sm_check",
      sql`${table.gridColumnSpanSm} IS NULL OR ${table.gridColumnSpanSm} BETWEEN 1 AND 12`
    ),
    areaTypeCheck: check(
      "comparison_components_area_type_check",
      sql`${table.areaType} IN ('prefecture', 'city')`
    ),
    areaTypeIdx: index("idx_comparison_components_area_type").on(
      table.areaType
    ),
    categoryAreaTypeIdx: index(
      "idx_comparison_components_category_area_type"
    ).on(table.categoryKey, table.areaType),
    categoryKeyIdx: index("idx_comparison_components_category").on(
      table.categoryKey
    ),
    displayOrderIdx: index("idx_comparison_components_display_order").on(
      table.displayOrder
    ),
    isActiveIdx: index("idx_comparison_components_is_active").on(
      table.isActive
    ),
  })
);

export type ComparisonComponent = typeof comparisonComponents.$inferSelect;
export type InsertComparisonComponent = typeof comparisonComponents.$inferInsert;

import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const insertComparisonComponentSchema = createInsertSchema(comparisonComponents);
export const selectComparisonComponentSchema = createSelectSchema(comparisonComponents);

import { relations } from "drizzle-orm";

export const comparisonComponentsRelations = relations(comparisonComponents, ({ one }) => ({
  category: one(categories, {
    fields: [comparisonComponents.categoryKey],
    references: [categories.categoryKey],
  }),
}));
