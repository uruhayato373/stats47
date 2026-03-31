import { sql } from "drizzle-orm";
import {
  index,
  integer,
  real,
  sqliteTable,
  text,
  uniqueIndex,
} from "drizzle-orm/sqlite-core";

/**
 * ダッシュボードコンポーネント用事前計算データ（Tier B — リモートのみ管理）
 *
 * e-Stat API から事前取得した数値を chart_key × area_code × year_code × category_key で格納。
 * 描画時は D1 優先 → R2/API フォールバックの順で参照する。
 * ローカル D1 には空テーブルのみ存在（データは持たない）。
 */
export const componentData = sqliteTable(
  "component_data",
  {
    id:          integer("id").primaryKey({ autoIncrement: true }),
    /** page_components.chart_key */
    chartKey:    text("chart_key").notNull(),
    /** 都道府県コード "01000"〜"47000" */
    areaCode:    text("area_code").notNull(),
    /** 調査年 "2020" */
    yearCode:    text("year_code").notNull(),
    /** セグメントラベル（segments[].label）または "__total__" */
    categoryKey: text("category_key").notNull(),
    value:       real("value"),
    unit:        text("unit"),
    /** 元の statsDataId（参照用） */
    sourceId:    text("source_id"),
    updatedAt:   text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (t) => ({
    uxComponentData: uniqueIndex("ux_component_data")
      .on(t.chartKey, t.areaCode, t.yearCode, t.categoryKey),
    idxLookup: index("idx_component_data_lookup")
      .on(t.chartKey, t.areaCode),
  }),
);
