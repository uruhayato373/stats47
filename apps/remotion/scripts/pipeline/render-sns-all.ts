#!/usr/bin/env tsx
/**
 * SNS 画像・動画 一括生成
 *
 * .local/r2/sns/ranking/ 配下の全ランキングディレクトリを走査し、
 * 各 SNS (Instagram/X/YouTube/TikTok/note) の静止画・動画を生成する。
 *
 * 前提:
 *   - data.json, ranking_items.json が各ディレクトリに存在すること
 *   - instagram/caption.json が存在すること（hookText 読み込み用）
 *
 * 出力先: .local/r2/sns/ranking/{rankingKey}/{sns}/stills/ or note/images/
 *
 * 実行: npm run pipeline:sns --workspace remotion
 *
 * オプション:
 *   --stills-only   静止画のみ生成（動画スキップ）
 *   --videos-only   動画のみ生成（静止画スキップ）
 *   --key <key>     特定のランキングキーのみ処理
 */

import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import Database from "better-sqlite3";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

const MONOREPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const SNS_ROOT = path.join(MONOREPO_ROOT, ".local", "r2", "sns", "ranking");
const D1_DIR = path.join(
  MONOREPO_ROOT,
  ".local",
  "d1",
  "v3",
  "d1",
  "miniflare-D1DatabaseObject"
);
const BROWSER_RESTART_INTERVAL = 50;

// ---------------------------------------------------------
// 引数解析
// ---------------------------------------------------------

const args = process.argv.slice(2);
const stillsOnly = args.includes("--stills-only");
const videosOnly = args.includes("--videos-only");
const keyIdx = args.indexOf("--key");
const targetKey = keyIdx !== -1 ? args[keyIdx + 1] : undefined;

// ---------------------------------------------------------
// D1 アクセス（visualization_config 読み込み）
// ---------------------------------------------------------

interface VizConfig {
  colorScheme: string;
  colorSchemeType?: "sequential" | "diverging";
  divergingMidpointValue?: number;
}

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

function loadVizConfigMap(dbPath: string): Map<string, VizConfig> {
  const db = new Database(dbPath, { readonly: true });
  const rows = db
    .prepare(
      `SELECT ranking_key, visualization_config
       FROM ranking_items
       WHERE visualization_config IS NOT NULL`
    )
    .all() as Array<{ ranking_key: string; visualization_config: string }>;
  db.close();

  const map = new Map<string, VizConfig>();
  for (const row of rows) {
    try {
      const vc = JSON.parse(row.visualization_config) as {
        colorScheme?: string;
        colorSchemeType?: string;
        divergingMidpointValue?: number;
      };
      if (vc.colorScheme) {
        map.set(row.ranking_key, {
          colorScheme: vc.colorScheme,
          colorSchemeType: vc.colorSchemeType as VizConfig["colorSchemeType"],
          divergingMidpointValue: vc.divergingMidpointValue,
        });
      }
    } catch {
      // skip invalid JSON
    }
  }
  return map;
}

// ---------------------------------------------------------
// Props 生成
// ---------------------------------------------------------

interface SnsData {
  categoryName: string;
  yearName: string;
  unit: string;
  data: Array<{
    rank: number;
    areaCode: string;
    areaName: string;
    value: number;
  }>;
}

interface SnsCaption {
  hookText?: string;
  displayTitle?: string;
}

interface RankingItemMeta {
  title?: string;
  subtitle?: string;
  unit?: string;
  demographicAttr?: string;
  normalizationBasis?: string;
}

interface SnsProps {
  theme: "light" | "dark";
  meta: {
    title: string;
    subtitle?: string;
    unit: string;
    yearName: string;
    demographicAttr?: string;
    normalizationBasis?: string;
  };
  allEntries: SnsData["data"];
  hookText?: string;
  displayTitle?: string;
  variant?: string;
  colorScheme?: string;
  colorSchemeType?: "sequential" | "diverging";
  divergingMidpointValue?: number;
}

async function loadProps(
  rankingDir: string,
  vizConfigMap: Map<string, VizConfig>
): Promise<{ light: SnsProps; ig: SnsProps; yt: SnsProps; tt: SnsProps } | null> {
  try {
    const dataJson = JSON.parse(
      await fs.readFile(path.join(rankingDir, "data.json"), "utf8")
    ) as SnsData;

    let caption: SnsCaption = {};
    try {
      caption = JSON.parse(
        await fs.readFile(
          path.join(rankingDir, "instagram", "caption.json"),
          "utf8"
        )
      );
    } catch {
      // caption がなくても続行
    }

    let itemMeta: RankingItemMeta = {};
    try {
      itemMeta = JSON.parse(
        await fs.readFile(path.join(rankingDir, "ranking_items.json"), "utf8")
      );
    } catch {
      // なくても続行
    }

    const meta = {
      title: itemMeta.title || dataJson.categoryName,
      subtitle: itemMeta.subtitle || undefined,
      unit: itemMeta.unit || dataJson.unit,
      yearName: dataJson.yearName,
      demographicAttr: itemMeta.demographicAttr || undefined,
      normalizationBasis: itemMeta.normalizationBasis || undefined,
    };

    const allEntries = dataJson.data.map((d) => ({
      rank: d.rank,
      areaCode: d.areaCode,
      areaName: d.areaName,
      value: d.value,
    }));

    const hookText = caption.hookText || "";
    const displayTitle = caption.displayTitle || undefined;

    // DB の visualization_config からカラースキームを取得
    const rankingKey = path.basename(rankingDir);
    const vizConfig = vizConfigMap.get(rankingKey);
    const colorScheme = vizConfig?.colorScheme;
    const colorSchemeType = vizConfig?.colorSchemeType;
    const divergingMidpointValue = vizConfig?.divergingMidpointValue;

    return {
      light: { theme: "light", meta, allEntries, colorScheme, colorSchemeType, divergingMidpointValue },
      ig: {
        theme: "dark",
        hookText,
        displayTitle,
        meta,
        allEntries,
        variant: "instagram",
        colorScheme,
        colorSchemeType,
        divergingMidpointValue,
      },
      yt: {
        theme: "dark",
        hookText,
        displayTitle,
        meta,
        allEntries,
        variant: "youtube",
        colorScheme,
        colorSchemeType,
        divergingMidpointValue,
      },
      tt: {
        theme: "dark",
        hookText,
        displayTitle,
        meta,
        allEntries,
        variant: "tiktok",
        colorScheme,
        colorSchemeType,
        divergingMidpointValue,
      },
    };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------
// ジョブ定義
// ---------------------------------------------------------

interface StillJob {
  type: "still";
  compositionId: string;
  outputPath: string;
  label: string;
  inputProps: Record<string, unknown>;
}

interface VideoJob {
  type: "video";
  compositionId: string;
  outputPath: string;
  label: string;
  inputProps: Record<string, unknown>;
}

type RenderJob = StillJob | VideoJob;

function buildJobs(
  rankingDir: string,
  props: { light: SnsProps; ig: SnsProps; yt: SnsProps; tt: SnsProps }
): RenderJob[] {
  const jobs: RenderJob[] = [];

  if (!videosOnly) {
    // Instagram stills
    jobs.push(
      {
        type: "still",
        compositionId: "RankingInstagram-Cover",
        outputPath: path.join(rankingDir, "instagram/stills/carousel_01.png"),
        label: "ig/carousel_01.png",
        inputProps: props.ig as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingInstagram-Table",
        outputPath: path.join(rankingDir, "instagram/stills/carousel_02.png"),
        label: "ig/carousel_02.png",
        inputProps: props.ig as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingInstagram-CTA",
        outputPath: path.join(rankingDir, "instagram/stills/carousel_03.png"),
        label: "ig/carousel_03.png",
        inputProps: props.ig as unknown as Record<string, unknown>,
      },
      // X stills
      {
        type: "still",
        compositionId: "RankingX-Chart",
        outputPath: path.join(rankingDir, "x/stills/chart-x-1200x630.png"),
        label: "x/chart.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingX-ChoroplethMap",
        outputPath: path.join(
          rankingDir,
          "x/stills/choropleth-map-1200x630.png"
        ),
        label: "x/choropleth.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      },
      // note images
      {
        type: "still",
        compositionId: "RankingNote-Cover",
        outputPath: path.join(rankingDir, "note/images/cover-1280x670.png"),
        label: "note/cover.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingNote-ChoroplethMap",
        outputPath: path.join(
          rankingDir,
          "note/images/choropleth-map-1080x1080.png"
        ),
        label: "note/choropleth.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingNote-Chart",
        outputPath: path.join(
          rankingDir,
          "note/images/chart-x-1200x630.png"
        ),
        label: "note/chart.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      },
      {
        type: "still",
        compositionId: "RankingNote-Boxplot",
        outputPath: path.join(
          rankingDir,
          "note/images/boxplot-1200x630.png"
        ),
        label: "note/boxplot.png",
        inputProps: props.light as unknown as Record<string, unknown>,
      }
    );
  }

  if (!stillsOnly) {
    // Videos
    jobs.push(
      {
        type: "video",
        compositionId: "RankingInstagram-Reel",
        outputPath: path.join(rankingDir, "instagram/stills/reel.mp4"),
        label: "ig/reel.mp4",
        inputProps: props.ig as unknown as Record<string, unknown>,
      },
      {
        type: "video",
        compositionId: "RankingYouTube-Short",
        outputPath: path.join(rankingDir, "youtube/stills/reel.mp4"),
        label: "yt/reel.mp4",
        inputProps: props.yt as unknown as Record<string, unknown>,
      },
      {
        type: "video",
        compositionId: "RankingTikTok-Short",
        outputPath: path.join(rankingDir, "tiktok/stills/reel.mp4"),
        label: "tt/reel.mp4",
        inputProps: props.tt as unknown as Record<string, unknown>,
      }
    );
  }

  return jobs;
}

// ---------------------------------------------------------
// レンダリング
// ---------------------------------------------------------

async function renderStillJob(
  bundleUrl: string,
  job: StillJob,
  browser: Awaited<ReturnType<typeof openBrowser>>
): Promise<void> {
  const composition = await selectComposition({
    serveUrl: bundleUrl,
    id: job.compositionId,
    inputProps: job.inputProps,
    puppeteerInstance: browser,
  });
  await renderStill({
    serveUrl: bundleUrl,
    composition,
    output: job.outputPath,
    inputProps: job.inputProps,
    imageFormat: "png",
    puppeteerInstance: browser,
  });
}

async function renderVideoJob(
  bundleUrl: string,
  job: VideoJob,
  browser: Awaited<ReturnType<typeof openBrowser>>
): Promise<void> {
  const composition = await selectComposition({
    serveUrl: bundleUrl,
    id: job.compositionId,
    inputProps: job.inputProps,
    puppeteerInstance: browser,
  });
  await renderMedia({
    serveUrl: bundleUrl,
    composition,
    outputLocation: job.outputPath,
    inputProps: job.inputProps,
    codec: "h264",
    puppeteerInstance: browser,
  });
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

async function main() {
  const mode = stillsOnly
    ? "stills only"
    : videosOnly
      ? "videos only"
      : "stills + videos";
  console.log(`📱 SNS Batch Generator (${mode})`);
  console.log("======================================================\n");

  // ランキングディレクトリ一覧
  let dirs: string[];
  try {
    const entries = await fs.readdir(SNS_ROOT, { withFileTypes: true });
    dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !targetKey || name === targetKey)
      .sort();
  } catch {
    console.error(`❌ SNS ディレクトリが見つかりません: ${SNS_ROOT}`);
    process.exit(1);
  }

  if (dirs.length === 0) {
    console.log(
      targetKey
        ? `❌ ランキングキー "${targetKey}" が見つかりません`
        : "❌ ランキングディレクトリがありません"
    );
    process.exit(1);
  }

  console.log(`📂 対象: ${dirs.length} ランキング\n`);

  // DB から visualization_config を読み込み
  let vizConfigMap = new Map<string, VizConfig>();
  try {
    console.log("🔍 Finding local D1 database...");
    const dbPath = await findD1Database();
    vizConfigMap = loadVizConfigMap(dbPath);
    console.log(`📁 D1: ${path.basename(dbPath)} (${vizConfigMap.size} configs loaded)\n`);
  } catch (err) {
    console.log(`⚠️  D1 読み込みスキップ（デフォルトカラースキームを使用）: ${err instanceof Error ? err.message : err}\n`);
  }

  // バンドル
  console.log("📦 Bundling Remotion project...");
  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");
  const bundleUrl = await bundle({
    entryPoint: path.join(projectRoot, "src", "index.ts"),
    webpackOverride: (config) => ({
      ...config,
      resolve: {
        ...config.resolve,
        alias: { ...(config.resolve?.alias ?? {}), "@": srcPath },
      },
    }),
  });
  console.log("✅ Bundle completed\n");

  let browser = await openBrowser("chrome");
  console.log("🌐 Chrome opened\n");

  let totalSuccess = 0;
  let totalFail = 0;
  let totalSkip = 0;
  let imageCount = 0;

  try {
    for (let i = 0; i < dirs.length; i++) {
      const key = dirs[i];
      const rankingDir = path.join(SNS_ROOT, key);

      console.log(`\n[${i + 1}/${dirs.length}] 🎨 ${key}`);

      const props = await loadProps(rankingDir, vizConfigMap);
      if (!props) {
        console.log("   ⏭️  data.json が見つからないためスキップ");
        totalSkip++;
        continue;
      }

      // ディレクトリ準備
      await Promise.all([
        fs.mkdir(path.join(rankingDir, "instagram/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "x/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "youtube/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "tiktok/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "note/images"), { recursive: true }),
      ]);

      const jobs = buildJobs(rankingDir, props);

      for (const job of jobs) {
        // ブラウザ定期再起動
        if (imageCount > 0 && imageCount % BROWSER_RESTART_INTERVAL === 0) {
          await browser.close({ silent: true });
          browser = await openBrowser("chrome");
          console.log(`   ♻️  Chrome restarted (${imageCount} renders done)`);
        }

        try {
          if (job.type === "still") {
            await renderStillJob(bundleUrl, job, browser);
          } else {
            await renderVideoJob(bundleUrl, job, browser);
          }
          console.log(`   ✅ ${job.label}`);
          totalSuccess++;
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          console.log(`   ❌ ${job.label}: ${msg.slice(0, 120)}`);
          totalFail++;
        }
        imageCount++;
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  console.log("\n\n📊 Summary");
  console.log("==========");
  console.log(`Rankings:  ${dirs.length} (skipped: ${totalSkip})`);
  console.log(`✅ Success: ${totalSuccess}`);
  console.log(`❌ Failed:  ${totalFail}`);
  console.log("\n✨ SNS batch rendering completed!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
