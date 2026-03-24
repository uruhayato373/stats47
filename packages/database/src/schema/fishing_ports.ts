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
 * 漁港マスタ — 漁港漁場整備法に基づく漁港 2,931港
 *
 * コード体系: 県コード2桁 + 種類1桁 + 番号4桁（例: 0111417 = 北海道_住吉）
 *
 * 種別:
 *  1 = 第1種（地元利用）
 *  2 = 第2種（第1種を超える利用範囲）
 *  3 = 第3種（全国的利用）
 *  4 = 第4種（離島等）
 *  5 = 特定第3種（水産業の振興上特に重要）
 */
export const fishingPorts = sqliteTable(
  "fishing_ports",
  {
    portCode: text("port_code").primaryKey(), // "1114170"
    portName: text("port_name").notNull(), // "住吉"
    prefectureCode: text("prefecture_code").notNull(), // "01"
    prefectureName: text("prefecture_name").notNull(), // "北海道"
    portType: text("port_type").notNull(), // "1"〜"5"
    portTypeName: text("port_type_name").notNull(), // "第1種漁港"
    administratorType: text("administrator_type"), // 管理者区分
    administratorName: text("administrator_name"), // 管理者名
    fisheryCooperative: text("fishery_cooperative"), // 関係漁業協同組合
    breakwaterLength: integer("breakwater_length"), // 外郭施設延長(m)
    mooringLength: integer("mooring_length"), // 係留施設延長(m)
    latitude: real("latitude").notNull(),
    longitude: real("longitude").notNull(),
    isActive: integer("is_active", { mode: "boolean" }).default(true),
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    prefectureIdx: index("idx_fishing_ports_prefecture").on(
      table.prefectureCode
    ),
    portTypeIdx: index("idx_fishing_ports_type").on(table.portType),
  })
);

export type FishingPort = typeof fishingPorts.$inferSelect;
export type InsertFishingPort = typeof fishingPorts.$inferInsert;

export const insertFishingPortSchema = createInsertSchema(fishingPorts);
export const selectFishingPortSchema = createSelectSchema(fishingPorts);
