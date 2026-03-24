import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

export const correlationAnalysis = sqliteTable(
  "correlation_analysis",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    rankingKeyX: text("ranking_key_x").notNull(),
    rankingKeyY: text("ranking_key_y").notNull(),
    yearX: text("year_x").notNull(),
    yearY: text("year_y").notNull(),
    pearsonR: real("pearson_r").notNull(),
    partialRPopulation: real("partial_r_population"),
    partialRArea: real("partial_r_area"),
    partialRAging: real("partial_r_aging"),
    partialRDensity: real("partial_r_density"),
    scatterData: text("scatter_data").notNull(),
    calculatedAt: text("calculated_at").notNull(),
  },
  (table) => ({
    rankingKeysUnq: uniqueIndex(
      "correlation_analysis_ranking_keys_year_unique"
    ).on(
      table.rankingKeyX,
      table.rankingKeyY,
      table.yearX,
      table.yearY
    ),
    rankingKeysIdx: index("idx_correlation_rankingkeys").on(
      table.rankingKeyX,
      table.rankingKeyY
    ),
    yearXIdx: index("idx_correlation_year_x").on(table.yearX),
    yearYIdx: index("idx_correlation_year_y").on(table.yearY),
    rankingkeyXYearIdx: index("idx_correlation_rankingkey_x_year").on(
      table.rankingKeyX,
      table.yearX
    ),
    rankingkeyYYearIdx: index("idx_correlation_rankingkey_y_year").on(
      table.rankingKeyY,
      table.yearY
    ),
  })
);

export const insertCorrelationAnalysisSchema = createInsertSchema(correlationAnalysis);
export const selectCorrelationAnalysisSchema = createSelectSchema(correlationAnalysis);

export type InsertCorrelationAnalysis = typeof correlationAnalysis.$inferInsert;
export type CorrelationAnalysis = typeof correlationAnalysis.$inferSelect;
