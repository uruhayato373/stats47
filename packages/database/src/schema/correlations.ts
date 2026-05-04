import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { indicators } from "./indicators";

/**
 * 相関分析 — 旧 correlation_analysis の置換 (PR-5)
 *
 * ranking_key_x / ranking_key_y (TEXT) → indicator_x_id / indicator_y_id (INTEGER FK)
 * 旧テーブルは area_type なし (全データ prefecture 想定) → indicator FK が prefecture 用
 */
export const correlations = sqliteTable(
  "correlations",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    indicatorXId: integer("indicator_x_id")
      .notNull()
      .references(() => indicators.id),
    indicatorYId: integer("indicator_y_id")
      .notNull()
      .references(() => indicators.id),
    yearX: text("year_x").notNull(),
    yearY: text("year_y").notNull(),
    pearsonR: real("pearson_r").notNull(),
    partialRPopulation: real("partial_r_population"),
    partialRArea: real("partial_r_area"),
    partialRAging: real("partial_r_aging"),
    partialRDensity: real("partial_r_density"),
    scatterDataJson: text("scatter_data_json").notNull(),
    calculatedAt: text("calculated_at").notNull().default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("idx_correlations_pair_year").on(
      table.indicatorXId,
      table.indicatorYId,
      table.yearX,
      table.yearY
    ),
    indicatorXIdx: index("idx_correlations_indicator_x").on(table.indicatorXId),
    indicatorYIdx: index("idx_correlations_indicator_y").on(table.indicatorYId),
    yearXIdx: index("idx_correlations_year_x").on(table.yearX),
    yearYIdx: index("idx_correlations_year_y").on(table.yearY),
  })
);

export type Correlation = typeof correlations.$inferSelect;
export type InsertCorrelation = typeof correlations.$inferInsert;

export const insertCorrelationSchema = createInsertSchema(correlations);
export const selectCorrelationSchema = createSelectSchema(correlations);
