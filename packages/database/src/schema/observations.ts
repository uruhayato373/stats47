import { sql } from "drizzle-orm";
import {
  index,
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

import { indicators } from "./indicators";

/**
 * 観測値 — 旧 ranking_data + port_statistics の統一テーブル (PR-3)
 *
 * (indicator_id, entity_type, entity_code, year_code) の複合 PK で一意。
 * entity_type は 4 種: prefecture / city / port / fishing_port
 *
 * 値カラム:
 * - value_numeric: 数値の本体
 * - value_text: 「未公表」等の non-numeric ラベル
 *
 * 非正規化列 (entity_name / year_name / unit / category_name):
 * R2 export 時に使用。マスタ (prefectures.name 等) を書き換えた場合は
 * scripts/sync-observations-denormalized.ts で再同期する。
 *
 * 並行運用フェーズ:
 * - PR-3: 本テーブル + 並行 reader 追加。旧 ranking_data は維持
 * - PR-5: 旧 reader 切替後、旧 ranking_data を DROP
 * - PR-6: port_statistics を本テーブルに統合し DROP
 */
export const observations = sqliteTable(
  "observations",
  {
    indicatorId: integer("indicator_id")
      .notNull()
      .references(() => indicators.id),
    entityType: text("entity_type", {
      enum: ["prefecture", "city", "port", "fishing_port"],
    }).notNull(),
    entityCode: text("entity_code").notNull(),
    yearCode: text("year_code").notNull(),
    valueNumeric: real("value_numeric"),
    valueText: text("value_text"),
    rank: integer("rank"),
    percentile: real("percentile"),
    entityName: text("entity_name"),
    yearName: text("year_name"),
    unit: text("unit"),
    categoryName: text("category_name"),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    pk: primaryKey({
      columns: [
        table.indicatorId,
        table.entityType,
        table.entityCode,
        table.yearCode,
      ],
    }),
    entityIdx: index("idx_observations_entity").on(
      table.entityType,
      table.entityCode,
      table.yearCode
    ),
    indicatorYearIdx: index("idx_observations_indicator_year").on(
      table.indicatorId,
      table.yearCode
    ),
  })
);

export type Observation = typeof observations.$inferSelect;
export type InsertObservation = typeof observations.$inferInsert;

export const insertObservationSchema = createInsertSchema(observations);
export const selectObservationSchema = createSelectSchema(observations);
