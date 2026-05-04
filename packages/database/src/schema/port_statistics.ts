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

/**
 * 港湾マスタ — 甲種港湾 171港
 * コード体系: 都道府県コード2桁 + 連番3桁（例: 01001 = 北海道_稚内）
 */
export const ports = sqliteTable(
  "ports",
  {
    portCode: text("port_code").primaryKey(), // "01001"
    portName: text("port_name").notNull(), // "稚内"
    prefectureCode: text("prefecture_code").notNull(), // "01"
    prefectureName: text("prefecture_name").notNull(), // "北海道"
    portClass: text("port_class", {
      enum: ["甲種", "乙種"],
    })
      .notNull()
      .default("甲種"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    portGrade: text("port_grade"), // 国際戦略港湾 / 国際拠点港湾 / 重要港湾
    administrator: text("administrator"), // 管理者（横浜市、東京都 等）
    cyportCode: text("cyport_code"), // サイバーポート港湾コード
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prefectureIdx: index("idx_ports_prefecture").on(table.prefectureCode),
    portClassIdx: index("idx_ports_class").on(table.portClass),
  })
);

/**
 * 港湾統計データ — 港×年×指標ごとの値
 *
 * metricKey 例:
 * - ships_total: 入港船舶隻数（合計）
 * - ships_tonnage: 入港船舶総トン数
 * - cargo_total: 海上出入貨物トン数（合計）
 * - cargo_export: 輸出貨物トン数
 * - cargo_import: 輸入貨物トン数
 * - cargo_coastal_out: 移出貨物トン数
 * - cargo_coastal_in: 移入貨物トン数
 */
export const portStatistics = sqliteTable(
  "port_statistics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    portCode: text("port_code")
      .notNull()
      .references(() => ports.portCode, { onDelete: "cascade" }),
    year: text("year").notNull(), // "2023"
    metricKey: text("metric_key").notNull(), // "ships_total", "cargo_export" etc.
    value: real("value").notNull(),
    unit: text("unit").notNull(), // "隻", "総トン", "トン"
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("port_statistics_unq").on(
      table.portCode,
      table.year,
      table.metricKey
    ),
    portYearIdx: index("idx_port_statistics_port_year").on(
      table.portCode,
      table.year
    ),
    metricIdx: index("idx_port_statistics_metric").on(
      table.metricKey,
      table.year
    ),
    yearIdx: index("idx_port_statistics_year").on(table.year),
  })
);

export type Port = typeof ports.$inferSelect;
export type InsertPort = typeof ports.$inferInsert;

export type PortStatistic = typeof portStatistics.$inferSelect;
export type InsertPortStatistic = typeof portStatistics.$inferInsert;

export const insertPortSchema = createInsertSchema(ports);
export const selectPortSchema = createSelectSchema(ports);

export const insertPortStatisticSchema = createInsertSchema(portStatistics);
export const selectPortStatisticSchema = createSelectSchema(portStatistics);
