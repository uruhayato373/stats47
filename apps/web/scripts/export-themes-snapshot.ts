/**
 * themes / theme_metrics を R2 snapshot 化する。
 *
 * 出力: app/themes/{themeKey}/config.json × テーマ数
 *   形式: { themeKey, title, description, category, usage, keywords, panels: [{ label, metrics: [...] }] }
 *
 * 使用方法:
 *   npx tsx -r ./packages/ranking/src/scripts/setup-cli.js \
 *     apps/web/scripts/export-themes-snapshot.ts
 */

import dotenv from "dotenv";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { asc, eq } from "drizzle-orm";
import fs from "fs";
import BetterSqlite3 from "better-sqlite3";

import { LOCAL_DB_PATHS } from "../../../packages/database/src/config/local-db-paths";
import * as schema from "../../../packages/database/src/schema";
import { saveToR2 } from "@stats47/r2-storage/server";

dotenv.config({ path: ".env.local" });

function resolveDatabasePath(): string {
  if (process.env.LOCAL_DB_PATH && fs.existsSync(process.env.LOCAL_DB_PATH)) {
    return process.env.LOCAL_DB_PATH;
  }
  const standardPath = LOCAL_DB_PATHS.STATIC.getPath();
  if (fs.existsSync(standardPath)) return standardPath;
  throw new Error(`ローカル D1 SQLite が見つかりません: ${standardPath}`);
}

function parseJson<T>(json: string | null, fallback: T): T {
  if (!json) return fallback;
  try {
    return JSON.parse(json) as T;
  } catch {
    return fallback;
  }
}

export interface ThemeMetricSnapshot {
  metricKey: string;
  shortLabel: string | null;
  role: "primary" | "secondary" | "context" | null;
  chartType: "choropleth" | "line" | "pie" | "bar" | "ranking-table";
  chartTarget: "national" | "prefecture" | null;
  chartConfig: Record<string, unknown> | null;
  panelOrder: number;
}

export interface ThemePanelSnapshot {
  label: string | null; // null = テーマ直下 (タブなし)
  metrics: ThemeMetricSnapshot[];
}

export interface ThemeConfigSnapshot {
  themeKey: string;
  title: string;
  description: string | null;
  category: string | null;
  usage: "theme" | "compare" | "both";
  keywords: string[];
  relatedArticleTagKeys: string[];
  displayOrder: number;
  panels: ThemePanelSnapshot[];
}

export function themeConfigKeyPath(themeKey: string): string {
  return `app/themes/${themeKey}/config.json`;
}

async function main() {
  const dbPath = resolveDatabasePath();
  console.log(`📁 DB: ${dbPath}`);

  const sqlite = new BetterSqlite3(dbPath, { readonly: true });
  const db = drizzle(sqlite, { schema });

  const themeRows = await db
    .select()
    .from(schema.themes)
    .where(eq(schema.themes.isActive, true))
    .orderBy(asc(schema.themes.displayOrder));

  const metricRows = await db
    .select()
    .from(schema.themeMetrics)
    .orderBy(
      asc(schema.themeMetrics.themeKey),
      asc(schema.themeMetrics.panelLabel),
      asc(schema.themeMetrics.panelOrder),
    );

  const metricsByTheme = new Map<string, typeof metricRows>();
  for (const row of metricRows) {
    const arr = metricsByTheme.get(row.themeKey) ?? [];
    arr.push(row);
    metricsByTheme.set(row.themeKey, arr);
  }

  let files = 0;
  for (const t of themeRows) {
    const tm = metricsByTheme.get(t.themeKey) ?? [];

    // panel_label でグループ化 (順序は metricRows の order by に依存)
    const panelMap = new Map<string | null, ThemeMetricSnapshot[]>();
    for (const m of tm) {
      const arr = panelMap.get(m.panelLabel ?? null) ?? [];
      arr.push({
        metricKey: m.metricKey,
        shortLabel: m.shortLabel,
        role: m.role,
        chartType: m.chartType,
        chartTarget: m.chartTarget,
        chartConfig: parseJson(m.chartConfigJson, null),
        panelOrder: m.panelOrder ?? 0,
      });
      panelMap.set(m.panelLabel ?? null, arr);
    }

    const panels: ThemePanelSnapshot[] = [...panelMap.entries()].map(
      ([label, metrics]) => ({ label, metrics }),
    );

    const config: ThemeConfigSnapshot = {
      themeKey: t.themeKey,
      title: t.title,
      description: t.description,
      category: t.category,
      usage: t.usage,
      keywords: parseJson<string[]>(t.keywordsJson, []),
      relatedArticleTagKeys: parseJson<string[]>(t.relatedArticleTagKeysJson, []),
      displayOrder: t.displayOrder ?? 0,
      panels,
    };

    await saveToR2(themeConfigKeyPath(t.themeKey), JSON.stringify(config), {
      contentType: "application/json; charset=utf-8",
    });
    files++;
  }

  console.log(`✅ themes: files=${files} (themes=${themeRows.length}, theme_metrics=${metricRows.length})`);
  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
