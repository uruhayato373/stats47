import { sql } from "drizzle-orm";
import {
  foreignKey,
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { metrics } from "./metrics";
import { prefectures } from "./prefectures";

/**
 * ペア観測値 (都道府県 ↔ 都道府県) を表現するテーブル。
 *
 * 用例: 住民基本台帳人口移動報告 (e-Stat 0003423613)
 *   metric_key = "population-migration-inter-prefecture"
 *   from_pref_code = "13000" (東京都), to_pref_code = "14000" (神奈川県)
 *   year_code = "2025"
 *   inflow / outflow / net (純移動)
 *
 * 単純な (metric, area, year) → value の単一エンティティ観測 (stats_prefecture)
 * では from / to 2 軸を表現できないため新規テーブルとして分離。
 */
export const statsMigrationFlow = sqliteTable(
  "stats_migration_flow",
  {
    metricKey: text("metric_key").notNull(),
    fromPrefCode: text("from_pref_code").notNull(),
    toPrefCode: text("to_pref_code").notNull(),
    yearCode: text("year_code").notNull(),
    inflow: integer("inflow"),
    outflow: integer("outflow"),
    net: integer("net"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [table.metricKey, table.fromPrefCode, table.toPrefCode, table.yearCode],
    }),
    metricFk: foreignKey({
      columns: [table.metricKey],
      foreignColumns: [metrics.key],
    }),
    fromFk: foreignKey({
      columns: [table.fromPrefCode],
      foreignColumns: [prefectures.code],
    }),
    toFk: foreignKey({
      columns: [table.toPrefCode],
      foreignColumns: [prefectures.code],
    }),
    toYearIdx: index("idx_mig_flow_to_year").on(table.toPrefCode, table.yearCode),
    fromYearIdx: index("idx_mig_flow_from_year").on(table.fromPrefCode, table.yearCode),
  })
);

export type StatsMigrationFlow = typeof statsMigrationFlow.$inferSelect;
export type InsertStatsMigrationFlow = typeof statsMigrationFlow.$inferInsert;

export const insertStatsMigrationFlowSchema = createInsertSchema(statsMigrationFlow);
export const selectStatsMigrationFlowSchema = createSelectSchema(statsMigrationFlow);
