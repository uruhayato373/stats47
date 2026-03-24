#!/usr/bin/env tsx
/**
 * サムネイル一括生成
 *
 * ローカル D1（SQLite）から isActive=true の全ランキングを取得し、
 * RankingThumbnail (240x240) を light/dark で一括生成する。
 *
 * 実行: npm run pipeline:ranking-thumbnails --workspace remotion
 */

import { bundle } from "@remotion/bundler";
import { openBrowser, renderStill, selectComposition } from "@remotion/renderer";
import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

const MONOREPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const R2_ROOT = path.join(MONOREPO_ROOT, ".local", "r2");
const D1_DIR = path.join(
  MONOREPO_ROOT,
  ".local",
  "d1",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);

const THEMES = ["light", "dark"] as const;
const BROWSER_RESTART_INTERVAL = 100; // Chrome を再起動するレンダリング間隔

// ---------------------------------------------------------
// D1 アクセス
// ---------------------------------------------------------

async function findD1Database(): Promise<string> {
  const files = await fs.readdir(D1_DIR);
  const sqliteFiles = files.filter((f) => f.endsWith(".sqlite"));

  for (const file of sqliteFiles) {
    const dbPath = path.join(D1_DIR, file);
    try {
      const db = new Database(dbPath, { readonly: true });
      const result = db
        .prepare(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='ranking_items'"
        )
        .get();
      db.close();
      if (result) return dbPath;
    } catch {
      continue;
    }
  }

  throw new Error("ranking_items テーブルを含む D1 SQLite が見つかりません");
}

interface RankingItemRow {
  ranking_key: string;
  title: string;
  subtitle: string | null;
  unit: string;
  latest_year: string | null;
  demographic_attr: string | null;
  normalization_basis: string | null;
  visualization_config: string | null;
}

interface RankingDataRow {
  area_code: string;
  area_name: string;
  value: number;
  rank: number;
}

interface RankingTarget {
  rankingKey: string;
  yearCode: string;
  meta: {
    title: string;
    subtitle?: string;
    unit: string;
    yearName?: string;
    demographicAttr?: string;
    normalizationBasis?: string;
  };
  entries: Array<{
    rank: number;
    areaCode: string;
    areaName: string;
    value: number;
  }>;
  colorScheme: string;
}

function loadAllRankingsFromD1(dbPath: string): RankingTarget[] {
  const db = new Database(dbPath, { readonly: true });

  const items = db
    .prepare(
      `SELECT ranking_key, title, subtitle, unit, latest_year,
              demographic_attr, normalization_basis, visualization_config
       FROM ranking_items
       WHERE area_type = 'prefecture' AND is_active = 1
       ORDER BY ranking_key`
    )
    .all() as RankingItemRow[];

  const dataStmt = db.prepare(
    `SELECT area_code, area_name, value, rank
     FROM ranking_data
     WHERE area_type = 'prefecture'
       AND category_code = ?
       AND year_code = ?
     ORDER BY rank ASC`
  );

  const targets: RankingTarget[] = [];

  for (const item of items) {
    let yearCode: string | undefined;
    let yearName: string | undefined;
    if (item.latest_year) {
      try {
        const parsed = JSON.parse(item.latest_year) as {
          yearCode?: string;
          yearName?: string;
        };
        yearCode = parsed.yearCode;
        yearName = parsed.yearName;
      } catch {
        // skip
      }
    }

    if (!yearCode) continue;

    const rows = dataStmt.all(item.ranking_key, yearCode) as RankingDataRow[];
    if (rows.length === 0) continue;

    let colorScheme = "interpolateBlues";
    if (item.visualization_config) {
      try {
        const vc = JSON.parse(item.visualization_config) as {
          colorScheme?: string;
        };
        if (vc.colorScheme) colorScheme = vc.colorScheme;
      } catch {
        // default
      }
    }

    targets.push({
      rankingKey: item.ranking_key,
      yearCode,
      meta: {
        title: item.title,
        subtitle: item.subtitle ?? undefined,
        unit: item.unit,
        yearName,
        demographicAttr: item.demographic_attr ?? undefined,
        normalizationBasis: item.normalization_basis ?? undefined,
      },
      entries: rows.map((r) => ({
        rank: r.rank,
        areaCode: r.area_code,
        areaName: r.area_name,
        value: r.value,
      })),
      colorScheme,
    });
  }

  db.close();
  return targets;
}

// ---------------------------------------------------------
// Remotion バンドル
// ---------------------------------------------------------

async function getBundleUrl(): Promise<string> {
  console.log("📦 Bundling Remotion project...");
  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");
  const url = await bundle({
    entryPoint: path.join(projectRoot, "src", "index.ts"),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: {
          ...(config.resolve?.alias ?? {}),
          "@": srcPath,
        },
      },
    }),
  });
  console.log("✅ Bundle completed\n");
  return url;
}

// ---------------------------------------------------------
// サムネイルレンダリング
// ---------------------------------------------------------

async function renderThumbnail(
  bundleUrl: string,
  target: RankingTarget,
  theme: "light" | "dark",
  outputDir: string,
  browser: Awaited<ReturnType<typeof openBrowser>>
): Promise<boolean> {
  const filename = `thumbnail-${theme}.png`;
  const inputProps = {
    theme,
    meta: target.meta,
    entries: target.entries,
    colorScheme: target.colorScheme,
  };

  try {
    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: "RankingThumbnail",
      inputProps,
      puppeteerInstance: browser,
    });

    await renderStill({
      serveUrl: bundleUrl,
      composition,
      output: path.join(outputDir, filename),
      inputProps,
      imageFormat: "png",
      puppeteerInstance: browser,
    });

    console.log(`   ✅ ${filename}`);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.log(`   ❌ ${filename}: ${msg}`);
    return false;
  }
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

async function main() {
  console.log("🖼️  Thumbnail Batch Generator");
  console.log("==============================\n");

  console.log("🔍 Finding local D1 database...");
  const dbPath = await findD1Database();
  console.log(`📁 D1: ${path.basename(dbPath)}\n`);

  console.log("📊 Loading all active rankings from D1...");
  const targets = loadAllRankingsFromD1(dbPath);
  console.log(`✅ Found ${targets.length} rankings with data\n`);

  if (targets.length === 0) {
    console.log("❌ No rankings found.");
    process.exit(1);
  }

  const bundleUrl = await getBundleUrl();

  let successCount = 0;
  let failCount = 0;
  let imageCount = 0;
  let browser = await openBrowser("chrome");
  console.log("🌐 Chrome opened\n");

  try {
    for (let i = 0; i < targets.length; i++) {
      const target = targets[i];
      console.log(
        `\n[${i + 1}/${targets.length}] 🎨 ${target.rankingKey} (${target.yearCode})`
      );

      const outputDir = path.join(
        R2_ROOT,
        "ranking",
        "prefecture",
        target.rankingKey,
        target.yearCode,
        "thumbnails"
      );
      await fs.mkdir(outputDir, { recursive: true });

      for (const theme of THEMES) {
        // Chrome を定期的に再起動してメモリを解放
        if (imageCount > 0 && imageCount % BROWSER_RESTART_INTERVAL === 0) {
          await browser.close({ silent: true });
          browser = await openBrowser("chrome");
          console.log(`\n♻️  Chrome restarted (${imageCount} images done)`);
        }

        const ok = await renderThumbnail(bundleUrl, target, theme, outputDir, browser);
        if (ok) successCount++;
        else failCount++;
        imageCount++;
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  console.log("\n\n📊 Summary");
  console.log("==========");
  console.log(`Rankings: ${targets.length}`);
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed:  ${failCount}`);
  console.log("\n✨ Thumbnail generation completed!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
