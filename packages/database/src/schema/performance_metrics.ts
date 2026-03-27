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
 * パフォーマンス計測テーブル
 *
 * PageSpeed Insights API / Lighthouse から取得したスコア・CWV・リソース情報を蓄積する。
 * url + strategy + date + source の複合 UNIQUE で UPSERT 対応。
 */
export const performanceMetrics = sqliteTable(
  "performance_metrics",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),

    // ── 識別 ──
    url: text("url").notNull(),
    pageType: text("page_type").notNull(), // "homepage" | "theme" | "area" | "compare" | "correlation" | "ranking"
    strategy: text("strategy").notNull(), // "mobile" | "desktop"
    date: text("date").notNull(), // "2026-03-26" (ISO 形式)

    // ── Lighthouse カテゴリスコア (0-100) ──
    scorePerformance: integer("score_performance"),
    scoreAccessibility: integer("score_accessibility"),
    scoreBestPractices: integer("score_best_practices"),
    scoreSeo: integer("score_seo"),

    // ── Core Web Vitals ──
    lcpMs: real("lcp_ms"), // Largest Contentful Paint
    fidMs: real("fid_ms"), // First Input Delay
    cls: real("cls"), // Cumulative Layout Shift
    inpMs: real("inp_ms"), // Interaction to Next Paint

    // ── その他タイミング指標 ──
    fcpMs: real("fcp_ms"), // First Contentful Paint
    siMs: real("si_ms"), // Speed Index
    tbtMs: real("tbt_ms"), // Total Blocking Time
    ttiMs: real("tti_ms"), // Time to Interactive
    ttfbMs: real("ttfb_ms"), // Time to First Byte

    // ── リソースサイズ (bytes) ──
    totalByteWeight: integer("total_byte_weight"),
    jsByteWeight: integer("js_byte_weight"),
    cssByteWeight: integer("css_byte_weight"),
    imageByteWeight: integer("image_byte_weight"),
    fontByteWeight: integer("font_byte_weight"),
    thirdPartyByteWeight: integer("third_party_byte_weight"),

    // ── DOM / リクエスト ──
    domSize: integer("dom_size"),
    requestCount: integer("request_count"),

    // ── CrUX フィールドデータ (p75) ──
    cruxLcpP75: real("crux_lcp_p75"),
    cruxInpP75: real("crux_inp_p75"),
    cruxClsP75: real("crux_cls_p75"),
    cruxTtfbP75: real("crux_ttfb_p75"),
    cruxFcpP75: real("crux_fcp_p75"),

    // ── メタ ──
    source: text("source").default("psi"), // "psi" | "lighthouse-cli" | "crux-api"
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("performance_metrics_url_strategy_date_source_unq").on(
      table.url,
      table.strategy,
      table.date,
      table.source
    ),
    dateIdx: index("idx_performance_metrics_date").on(table.date),
    pageTypeIdx: index("idx_performance_metrics_page_type").on(table.pageType),
    urlIdx: index("idx_performance_metrics_url").on(table.url),
    pageTypeDateIdx: index("idx_performance_metrics_page_type_date").on(
      table.pageType,
      table.date
    ),
  })
);

export type PerformanceMetric = typeof performanceMetrics.$inferSelect;
export type InsertPerformanceMetric = typeof performanceMetrics.$inferInsert;

export const insertPerformanceMetricSchema =
  createInsertSchema(performanceMetrics);
export const selectPerformanceMetricSchema =
  createSelectSchema(performanceMetrics);

/**
 * パフォーマンスバジェットテーブル
 *
 * ページタイプ × strategy ごとのメトリクス閾値を管理する。
 * page_type + strategy + metric_key の複合 UNIQUE。
 */
export const performanceBudgets = sqliteTable(
  "performance_budgets",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    pageType: text("page_type").notNull(), // "all" | "homepage" | "theme" | "area" etc.
    strategy: text("strategy").notNull(), // "mobile" | "desktop"
    metricKey: text("metric_key").notNull(), // "score_performance" | "lcp_ms" | "cls" etc.
    threshold: real("threshold").notNull(),
    operator: text("operator").notNull().default("<="), // "<=" | ">="
    severity: text("severity").notNull().default("warning"), // "error" | "warning" | "info"
    createdAt: text("created_at").default(sql`CURRENT_TIMESTAMP`),
    updatedAt: text("updated_at").default(sql`CURRENT_TIMESTAMP`),
  },
  (table) => ({
    unq: uniqueIndex("performance_budgets_type_strategy_metric_unq").on(
      table.pageType,
      table.strategy,
      table.metricKey
    ),
  })
);

export type PerformanceBudget = typeof performanceBudgets.$inferSelect;
export type InsertPerformanceBudget = typeof performanceBudgets.$inferInsert;

export const insertPerformanceBudgetSchema =
  createInsertSchema(performanceBudgets);
export const selectPerformanceBudgetSchema =
  createSelectSchema(performanceBudgets);
