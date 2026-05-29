#!/usr/bin/env tsx
/**
 * seed-themes: packages/types/src/indicator-sets/*.ts (TS ハードコード) を
 * D1 の themes / theme_metrics テーブルに投入する。
 *
 * - 冪等: ON CONFLICT DO UPDATE で何度走らせても OK
 * - 既存 TS の THEME_INDICATOR_SETS と COMPARE_INDICATOR_SETS を両方投入する
 *   (usage='theme' / usage='compare')
 * - chart_type は seed 時点で全て 'choropleth' (Phase 2 で line/pie 行を追加予定)
 *
 * Usage:
 *   npm run seed:themes --workspace=packages/database
 *   npm run seed:themes --workspace=packages/database -- --dry-run
 */

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { sql } from "drizzle-orm";
import fs from "fs";
import path from "path";

import {
  THEME_INDICATOR_SETS,
  COMPARE_INDICATOR_SETS,
} from "@stats47/types";
import type { IndicatorSet, IndicatorEntry } from "@stats47/types";

import { themes, themeMetrics } from "../src/schema/themes";

const isDryRun = process.argv.includes("--dry-run");

function findSqliteFile(): string {
  // ローカルビルド DB (SQLite): packages/database/.data/stats47.sqlite
  const fixed = path.resolve(__dirname, "../.data/stats47.sqlite");
  if (!fs.existsSync(fixed)) {
    throw new Error(
      `ローカルビルド DB (SQLite) が見つかりません: ${fixed}\n` +
        `先に \`npm run db:pull --workspace=packages/r2-storage\` (R2 から取得) ` +
        `または \`npm run db:migrate:local --workspace=packages/database\` (空 schema 作成) を実行してください。`,
    );
  }
  return fixed;
}

interface SeedRow {
  themeKey: string;
  metricKey: string;
  panelLabel: string | null;
  panelOrder: number;
  role: IndicatorEntry["role"] | null;
  shortLabel: string;
}

function buildThemeMetricRows(set: IndicatorSet): SeedRow[] {
  const rows: SeedRow[] = [];
  const panelTabByKey = new Map<string, { label: string; order: number }>();
  for (const tab of set.panelTabs ?? []) {
    tab.rankingKeys.forEach((rk, idx) => {
      panelTabByKey.set(rk, { label: tab.label, order: idx });
    });
  }

  for (const m of set.metrics) {
    const panel = panelTabByKey.get(m.rankingKey);
    rows.push({
      themeKey: set.key,
      metricKey: m.rankingKey,
      panelLabel: panel?.label ?? null,
      panelOrder: panel?.order ?? 0,
      role: m.role ?? null,
      shortLabel: m.shortLabel,
    });
  }
  return rows;
}

async function main() {
  const sqlitePath = findSqliteFile();
  console.log(`📂 D1: ${sqlitePath}`);

  const sqlite = new Database(sqlitePath);
  const db = drizzle(sqlite);

  const themeSets = THEME_INDICATOR_SETS.map((s, i) => ({
    set: s,
    usage: "theme" as const,
    displayOrder: i,
  }));
  const compareSets = COMPARE_INDICATOR_SETS.map((s, i) => ({
    set: s,
    usage: "compare" as const,
    displayOrder: 100 + i,
  }));
  const allSets = [...themeSets, ...compareSets];

  console.log(
    `📦 投入対象: ${allSets.length} テーマ (theme=${themeSets.length} compare=${compareSets.length})`,
  );

  let themeUpserts = 0;
  let metricUpserts = 0;

  for (const { set, usage, displayOrder } of allSets) {
    const themeRow = {
      themeKey: set.key,
      title: set.title,
      description: set.description,
      category: set.category,
      usage,
      keywordsJson: JSON.stringify(set.keywords ?? []),
      relatedArticleTagKeysJson: JSON.stringify(set.relatedArticleTagKeys ?? []),
      displayOrder,
      isActive: true,
    };

    if (isDryRun) {
      console.log(`[dry-run] theme: ${set.key} (${usage}, order=${displayOrder})`);
    } else {
      await db
        .insert(themes)
        .values(themeRow)
        .onConflictDoUpdate({
          target: themes.themeKey,
          set: {
            title: themeRow.title,
            description: themeRow.description,
            category: themeRow.category,
            usage: themeRow.usage,
            keywordsJson: themeRow.keywordsJson,
            relatedArticleTagKeysJson: themeRow.relatedArticleTagKeysJson,
            displayOrder: themeRow.displayOrder,
            isActive: themeRow.isActive,
            updatedAt: sql`CURRENT_TIMESTAMP`,
          },
        });
      themeUpserts++;
    }

    const metricRows = buildThemeMetricRows(set);
    for (const r of metricRows) {
      if (isDryRun) {
        console.log(
          `  [dry-run] metric: ${r.metricKey} panel=${r.panelLabel ?? "-"} role=${r.role ?? "-"}`,
        );
      } else {
        await db
          .insert(themeMetrics)
          .values({
            themeKey: r.themeKey,
            metricKey: r.metricKey,
            panelLabel: r.panelLabel,
            panelOrder: r.panelOrder,
            role: r.role,
            shortLabel: r.shortLabel,
            chartType: "choropleth",
          })
          .onConflictDoUpdate({
            target: [themeMetrics.themeKey, themeMetrics.metricKey, themeMetrics.chartType],
            set: {
              panelLabel: r.panelLabel,
              panelOrder: r.panelOrder,
              role: r.role,
              shortLabel: r.shortLabel,
              updatedAt: sql`CURRENT_TIMESTAMP`,
            },
          });
        metricUpserts++;
      }
    }
  }

  if (isDryRun) {
    console.log("\n✅ dry-run 完了 (DB 書き込みなし)");
  } else {
    console.log(
      `\n✅ seed 完了: themes upsert=${themeUpserts}, theme_metrics upsert=${metricUpserts}`,
    );
  }

  sqlite.close();
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});
