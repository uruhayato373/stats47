import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";

/**
 * 港湾マスタ — 甲種港湾 171港
 * コード体系: 都道府県コード2桁 + 連番3桁（例: 01001 = 北海道_稚内）
 *
 * 旧 portStatistics は PR-6 で observations(entity_type='port') に統合し DROP した。
 * port 別の時系列値を取得する場合は observations テーブルを参照すること。
 */
export const ports = sqliteTable(
  "ports",
  {
    portCode: text("port_code").primaryKey(),
    portName: text("port_name").notNull(),
    prefectureCode: text("prefecture_code").notNull(),
    prefectureName: text("prefecture_name").notNull(),
    portClass: text("port_class", {
      enum: ["甲種", "乙種"],
    })
      .notNull()
      .default("甲種"),
    latitude: real("latitude"),
    longitude: real("longitude"),
    portGrade: text("port_grade"),
    administrator: text("administrator"),
    cyportCode: text("cyport_code"),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prefectureIdx: index("idx_ports_prefecture").on(table.prefectureCode),
    portClassIdx: index("idx_ports_class").on(table.portClass),
  })
);

export type Port = typeof ports.$inferSelect;
export type InsertPort = typeof ports.$inferInsert;

export const insertPortSchema = createInsertSchema(ports);
export const selectPortSchema = createSelectSchema(ports);
