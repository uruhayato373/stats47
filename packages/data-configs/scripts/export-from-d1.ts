/**
 * 既存 D1 `metrics` テーブル全 2,207 行を packages/data-configs/src/metrics/*.ts に export する one-shot script。
 *
 * 使い方:
 *   tsx packages/data-configs/scripts/export-from-d1.ts          # 全件
 *   tsx packages/data-configs/scripts/export-from-d1.ts --limit 10  # smoke
 *   tsx packages/data-configs/scripts/export-from-d1.ts --key <metric_key>  # 単一
 *
 * 出力:
 *   - src/metrics/<key>.ts (per metric)
 *   - 既存ファイルは上書き (DB が真実源)
 *
 * 完了後: build-registry.ts で registry.ts を再生成。
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { resolve } from "node:path";
import Database from "better-sqlite3";
import {
  D1_PATH,
  METRICS_DIR,
  formatTsValue,
  keyToFilename,
  keyToIdentifier,
} from "./_lib.js";
import type {
  CalculationOptions,
  DisplayConfig,
  EntityKind,
  MetricConfig,
  SourceConfig,
  VisualizationConfig,
  YearSpec,
} from "../src/types.js";

interface Args {
  limit?: number;
  onlyKey?: string;
}

function parseArgs(): Args {
  const argv = process.argv.slice(2);
  const out: Args = {};
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--limit") out.limit = Number(argv[++i]);
    else if (a === "--key") out.onlyKey = argv[++i];
  }
  return out;
}

interface MetricRow {
  key: string;
  title: string;
  subtitle: string | null;
  description: string | null;
  unit: string;
  source_id: string | null;
  category_key: string | null;
  visualization_config_json: string | null;
  source_config_json: string | null;
  value_display_config_json: string | null;
  calculation_config_json: string | null;
  year_format: string;
  additional_categories_json: string | null;
  group_key: string | null;
  seo_title: string | null;
  seo_description: string | null;
  is_active: number;
  is_featured: number;
  featured_order: number | null;
}

function tryParseJson<T>(s: string | null): T | undefined {
  if (!s) return undefined;
  try {
    return JSON.parse(s) as T;
  } catch {
    return undefined;
  }
}

/**
 * 旧 source_config_json (柔軟な構造) → 新 SourceConfig (discriminated union) に正規化
 */
function normalizeSource(
  sourceId: string | null,
  rawConfig: string | null,
): SourceConfig {
  const cfg =
    tryParseJson<{
      source?: { name?: string; url?: string };
      statsDataId?: string;
      cdCat01?: string;
      cdCat02?: string;
      [k: string]: unknown;
    }>(rawConfig) ?? {};

  // estat:0000010101 形式 → e-Stat
  if (sourceId?.startsWith("estat:")) {
    return {
      kind: "estat",
      statsDataId: cfg.statsDataId ?? sourceId.slice("estat:".length),
      cdCat01: cfg.cdCat01,
      cdCat02: cfg.cdCat02,
      displayName: cfg.source?.name,
      url: cfg.source?.url,
    };
  }
  // kakei-chousa
  if (sourceId === "kakei-chousa") {
    return {
      kind: "kakei-chousa",
      filter: cfg as Record<string, string>,
      displayName: cfg.source?.name,
      url: cfg.source?.url,
    };
  }
  // mlit
  if (sourceId?.startsWith("mlit:")) {
    return {
      kind: "mlit",
      resourceId: sourceId.slice("mlit:".length),
      displayName: cfg.source?.name,
      url: cfg.source?.url,
    };
  }
  // fallback: estat plain
  if (cfg.statsDataId) {
    return {
      kind: "estat",
      statsDataId: cfg.statsDataId,
      cdCat01: cfg.cdCat01,
      cdCat02: cfg.cdCat02,
      displayName: cfg.source?.name,
      url: cfg.source?.url,
    };
  }
  // unknown → external
  return {
    kind: "external",
    fetcherKey: sourceId ?? "unknown",
    config: cfg as Record<string, unknown>,
    displayName: cfg.source?.name,
    url: cfg.source?.url,
  };
}

/**
 * 既存テーブル (stats_prefecture / stats_city / stats_port / stats_migration_flow) を
 * 横断して、当該 metric が観測値を持つ entity 種別を返す
 */
function detectEntityKinds(db: Database.Database, key: string): EntityKind[] {
  const kinds: EntityKind[] = [];
  const has = (table: string): boolean => {
    const row = db
      .prepare(`SELECT 1 FROM ${table} WHERE metric_key = ? LIMIT 1`)
      .get(key);
    return Boolean(row);
  };
  if (has("stats_prefecture")) kinds.push("prefecture");
  if (has("stats_city")) kinds.push("city");
  if (has("stats_port")) kinds.push("port");
  try {
    if (has("stats_migration_flow")) kinds.push("migration-flow");
  } catch {
    // table may not exist
  }
  return kinds.length > 0 ? kinds : ["prefecture"]; // safe fallback
}

/**
 * year_code を 4 桁年に正規化 (e-Stat フルタイムコード 2009100000 → 2009)。
 * これを怠ると config.years にフルコードが混入し「2009100000 問題」が再発する。
 * 規約: .claude/rules/estat-api.md「年の正規化」。正準: extractYearCode (estat-api)。
 */
function to4DigitYear(yearCode: string): number {
  const n = Number(yearCode);
  if (!Number.isFinite(n)) return NaN;
  return n > 9999 ? Number(String(Math.trunc(n)).slice(0, 4)) : n;
}

/** detect available years from stats_* tables */
function detectYearSpec(db: Database.Database, key: string, kinds: EntityKind[]): YearSpec {
  const yearsSet = new Set<number>();
  if (kinds.includes("prefecture")) {
    const rows = db
      .prepare(`SELECT DISTINCT year_code FROM stats_prefecture WHERE metric_key = ?`)
      .all(key) as Array<{ year_code: string }>;
    for (const r of rows) {
      const y = to4DigitYear(r.year_code);
      if (Number.isFinite(y)) yearsSet.add(y);
    }
  }
  if (kinds.includes("city")) {
    const rows = db
      .prepare(`SELECT DISTINCT year_code FROM stats_city WHERE metric_key = ?`)
      .all(key) as Array<{ year_code: string }>;
    for (const r of rows) {
      const y = to4DigitYear(r.year_code);
      if (Number.isFinite(y)) yearsSet.add(y);
    }
  }
  if (kinds.includes("port")) {
    const rows = db
      .prepare(`SELECT DISTINCT year_code FROM stats_port WHERE metric_key = ?`)
      .all(key) as Array<{ year_code: string }>;
    for (const r of rows) {
      const y = to4DigitYear(r.year_code);
      if (Number.isFinite(y)) yearsSet.add(y);
    }
  }
  if (yearsSet.size === 0) return "all";
  const years = Array.from(yearsSet).sort((a, b) => a - b);
  const min = years[0];
  const max = years[years.length - 1];
  // contiguous range?
  if (years.length === max - min + 1) return { from: min, to: max };
  return { years };
}

function buildMetricConfig(db: Database.Database, row: MetricRow): MetricConfig {
  const source = normalizeSource(row.source_id, row.source_config_json);
  const entities = detectEntityKinds(db, row.key);
  const years = detectYearSpec(db, row.key, entities);

  const visualization = tryParseJson<VisualizationConfig>(row.visualization_config_json);
  const display = tryParseJson<DisplayConfig>(row.value_display_config_json);
  const calculation = tryParseJson<CalculationOptions>(row.calculation_config_json);
  const additionalCategories = tryParseJson<string[]>(row.additional_categories_json);

  const config: MetricConfig = {
    key: row.key,
    title: row.title,
    subtitle: row.subtitle ?? undefined,
    description: row.description ?? undefined,
    unit: row.unit,
    category: row.category_key ?? "uncategorized",
    source,
    entities,
    years,
    yearFormat: (row.year_format as MetricConfig["yearFormat"]) ?? "fiscal",
    visualization: visualization && Object.keys(visualization).length > 0 ? visualization : undefined,
    display: display && Object.keys(display).length > 0 ? display : undefined,
    calculation: calculation ?? undefined,
    additionalCategories: additionalCategories ?? undefined,
    groupKey: row.group_key ?? undefined,
    seoTitle: row.seo_title ?? undefined,
    seoDescription: row.seo_description ?? undefined,
    isActive: row.is_active === 1,
    isFeatured: row.is_featured === 1,
    featuredOrder: row.featured_order ?? undefined,
  };

  return config;
}

function emitMetricFile(config: MetricConfig): string {
  const ident = keyToIdentifier(config.key);
  const body = formatTsValue(config, 0);
  return `import type { MetricConfig } from "../types";

export const ${ident}: MetricConfig = ${body};
`;
}

async function main() {
  const args = parseArgs();
  if (!existsSync(D1_PATH)) {
    throw new Error(`D1 not found: ${D1_PATH}`);
  }

  const db = new Database(D1_PATH, { readonly: true });
  db.pragma("foreign_keys = ON");

  let query = `SELECT * FROM metrics ORDER BY key`;
  if (args.onlyKey) query += ` /* skipped, filter applied below */`;

  let rows = db.prepare(query).all() as MetricRow[];
  if (args.onlyKey) rows = rows.filter((r) => r.key === args.onlyKey);
  if (args.limit) rows = rows.slice(0, args.limit);

  mkdirSync(METRICS_DIR, { recursive: true });

  let wrote = 0;
  let failed = 0;
  console.log(`[export] processing ${rows.length} metrics...`);
  for (const row of rows) {
    try {
      const config = buildMetricConfig(db, row);
      const filePath = resolve(METRICS_DIR, keyToFilename(row.key));
      writeFileSync(filePath, emitMetricFile(config));
      wrote++;
      if (wrote % 100 === 0) console.log(`  progress: ${wrote}/${rows.length}`);
    } catch (e) {
      failed++;
      console.error(`[fail] ${row.key}: ${(e as Error).message}`);
    }
  }

  db.close();
  console.log(`\n[done] wrote ${wrote} files. failed: ${failed}`);
  console.log(`Next: pnpm --filter @stats47/data-configs build:registry`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
