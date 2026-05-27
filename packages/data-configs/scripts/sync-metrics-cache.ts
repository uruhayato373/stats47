/**
 * TS registry (data-configs) → D1 metrics テーブル (cache) に同期する。
 *
 * 動作:
 *   1. registry.ts を import して全 MetricConfig を取得
 *   2. D1 metrics の現在状態と diff
 *   3. INSERT (新規) / UPDATE (変更) / 警告 (TS に無い D1 行)
 *   4. dry-run デフォルト、--apply で実行
 *
 * Phase 6.1 以降は metrics テーブルへの書き込み権限は本スクリプトのみ。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/sync-metrics-cache.ts            # dry-run
 *   tsx packages/data-configs/scripts/sync-metrics-cache.ts --apply
 */
import Database from "better-sqlite3";
import { D1_PATH } from "./_lib.js";
import { listAllMetrics } from "../src/registry.js";
import type { MetricConfig, SourceConfig } from "../src/types.js";

const APPLY = process.argv.includes("--apply");

/** MetricConfig → D1 row payload */
function configToRow(c: MetricConfig): Record<string, unknown> {
  const sourceId = sourceConfigToId(c.source);
  return {
    key: c.key,
    title: c.title,
    subtitle: c.subtitle ?? null,
    description: c.description ?? null,
    unit: c.unit,
    source_id: sourceId,
    category_key: c.category,
    visualization_config_json: c.visualization
      ? JSON.stringify(c.visualization)
      : null,
    source_config_json: JSON.stringify(sourceConfigToLegacyJson(c.source)),
    value_display_config_json: c.display ? JSON.stringify(c.display) : null,
    calculation_config_json: c.calculation ? JSON.stringify(c.calculation) : null,
    year_format: c.yearFormat ?? "fiscal",
    additional_categories_json: c.additionalCategories
      ? JSON.stringify(c.additionalCategories)
      : null,
    group_key: c.groupKey ?? null,
    seo_title: c.seoTitle ?? null,
    seo_description: c.seoDescription ?? null,
    is_active: c.isActive === false ? 0 : 1,
    is_featured: c.isFeatured ? 1 : 0,
    featured_order: c.featuredOrder ?? null,
  };
}

function sourceConfigToId(s: SourceConfig): string {
  switch (s.kind) {
    case "estat":
      return `estat:${s.statsDataId}`;
    case "kakei-chousa":
      return "kakei-chousa";
    case "mlit":
      return `mlit:${s.resourceId}`;
    case "external":
      return s.fetcherKey;
    case "calculated":
      return "calculated";
  }
}

function sourceConfigToLegacyJson(s: SourceConfig): Record<string, unknown> {
  // 旧 format との互換 (web app reader が未変更のため)
  const sourceMeta = (() => {
    if ("displayName" in s || "url" in s) {
      const m: Record<string, string> = {};
      if (s.displayName) m.name = s.displayName;
      if (s.url) m.url = s.url;
      return Object.keys(m).length > 0 ? m : undefined;
    }
    return undefined;
  })();

  switch (s.kind) {
    case "estat":
      return {
        ...(sourceMeta ? { source: sourceMeta } : {}),
        statsDataId: s.statsDataId,
        ...(s.cdCat01 ? { cdCat01: s.cdCat01 } : {}),
        ...(s.cdCat02 ? { cdCat02: s.cdCat02 } : {}),
      };
    case "kakei-chousa":
      return {
        ...(sourceMeta ? { source: sourceMeta } : {}),
        ...(s.filter ?? {}),
      };
    case "mlit":
      return {
        ...(sourceMeta ? { source: sourceMeta } : {}),
        resourceId: s.resourceId,
      };
    case "external":
      return s.config;
    case "calculated":
      return { formula: s.formula };
  }
}

interface DiffEntry {
  key: string;
  action: "insert" | "update" | "delete-warn";
  fields?: string[];
}

function main() {
  const db = new Database(D1_PATH);
  db.pragma("foreign_keys = ON");

  const configs = listAllMetrics();
  console.log(`[sync] registry has ${configs.length} metrics`);
  if (configs.length === 0) {
    console.warn("[sync] empty registry — refusing to proceed (would delete D1)");
    db.close();
    return;
  }

  const existing = db
    .prepare(`SELECT key FROM metrics`)
    .all() as Array<{ key: string }>;
  const existingKeys = new Set(existing.map((r) => r.key));
  const configKeys = new Set(configs.map((c) => c.key));

  const diff: DiffEntry[] = [];
  for (const c of configs) {
    if (existingKeys.has(c.key)) {
      diff.push({ key: c.key, action: "update" });
    } else {
      diff.push({ key: c.key, action: "insert" });
    }
  }
  for (const e of existing) {
    if (!configKeys.has(e.key)) {
      diff.push({ key: e.key, action: "delete-warn" });
    }
  }

  const inserts = diff.filter((d) => d.action === "insert").length;
  const updates = diff.filter((d) => d.action === "update").length;
  const orphans = diff.filter((d) => d.action === "delete-warn").length;
  console.log(`[sync] insert: ${inserts}, update: ${updates}, orphan (D1 only): ${orphans}`);

  if (orphans > 0) {
    console.log("[sync] orphan metrics (D1 のみに存在、TS には無い):");
    for (const d of diff.filter((d) => d.action === "delete-warn").slice(0, 10)) {
      console.log(`  ${d.key}`);
    }
    if (orphans > 10) console.log(`  ... and ${orphans - 10} more`);
  }

  if (!APPLY) {
    console.log("\n(re-run with --apply to write)");
    db.close();
    return;
  }

  const upsertStmt = db.prepare(`
    INSERT INTO metrics (
      key, title, subtitle, description, unit, source_id, category_key,
      visualization_config_json, source_config_json, value_display_config_json,
      calculation_config_json, year_format, additional_categories_json,
      group_key, seo_title, seo_description, is_active, is_featured, featured_order
    ) VALUES (
      @key, @title, @subtitle, @description, @unit, @source_id, @category_key,
      @visualization_config_json, @source_config_json, @value_display_config_json,
      @calculation_config_json, @year_format, @additional_categories_json,
      @group_key, @seo_title, @seo_description, @is_active, @is_featured, @featured_order
    )
    ON CONFLICT(key) DO UPDATE SET
      title = excluded.title,
      subtitle = excluded.subtitle,
      description = excluded.description,
      unit = excluded.unit,
      source_id = excluded.source_id,
      category_key = excluded.category_key,
      visualization_config_json = excluded.visualization_config_json,
      source_config_json = excluded.source_config_json,
      value_display_config_json = excluded.value_display_config_json,
      calculation_config_json = excluded.calculation_config_json,
      year_format = excluded.year_format,
      additional_categories_json = excluded.additional_categories_json,
      group_key = excluded.group_key,
      seo_title = excluded.seo_title,
      seo_description = excluded.seo_description,
      is_active = excluded.is_active,
      is_featured = excluded.is_featured,
      featured_order = excluded.featured_order,
      updated_at = CURRENT_TIMESTAMP
  `);

  const tx = db.transaction((rows: Record<string, unknown>[]) => {
    for (const r of rows) upsertStmt.run(r);
  });
  tx(configs.map(configToRow));

  console.log(`[sync] upserted ${configs.length} metrics`);
  if (orphans > 0) {
    console.log("[sync] note: orphan rows kept (not deleted). Investigate manually.");
  }
  db.close();
}

main();
