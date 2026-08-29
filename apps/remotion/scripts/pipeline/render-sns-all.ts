#!/usr/bin/env tsx
/**
 * SNS 画像・動画 一括生成
 *
 * .local/r2/sns/ranking/ 配下の全ランキングディレクトリを走査し、
 * 現行チャネルの Instagram/X/note 用素材を生成する。
 * YouTube pilot は通常動画 master-first のため本バッチで Shorts を生成せず、TikTok は撤退済み。
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
 *   --note-only     note用4枚だけ生成（動画は常にスキップ）
 *   --key <key>     特定のランキングキーのみ処理
 */

import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderMedia,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

const MONOREPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const SNS_ROOT = path.join(MONOREPO_ROOT, ".local", "r2", "sns", "ranking");
// 完全DBレス (docs/01_技術設計/19): visualization は D1 metrics ではなく
// R2 ranking item.json (.item.visualization) を SSOT として読む。
const RANKING_ROOT = path.join(MONOREPO_ROOT, ".local", "r2", "app", "ranking");
const BROWSER_RESTART_INTERVAL = 50;

// ---------------------------------------------------------
// 引数解析
// ---------------------------------------------------------

const args = process.argv.slice(2);
const stillsOnly = args.includes("--stills-only");
const videosOnly = args.includes("--videos-only");
const noteOnly = args.includes("--note-only");
const keyIdx = args.indexOf("--key");
const targetKey = keyIdx !== -1 ? args[keyIdx + 1] : undefined;

// ---------------------------------------------------------
// visualization 読み込み（R2 ranking item.json の .item.visualization）
// ---------------------------------------------------------

interface VizConfig {
  colorScheme: string;
  colorSchemeType?: "sequential" | "diverging";
  divergingMidpointValue?: number;
}

/**
 * R2 ranking item.json (`.item.visualization`) からカラースキーム設定を読む。
 * D1 metrics.visualization_config_json と同じ 3 フィールドを抽出する。
 * item.json が無い / visualization が無い / colorScheme 未設定なら undefined
 * （= 呼び出し側はデフォルトカラースキームにフォールバック）。
 */
async function loadVizConfig(rankingKey: string): Promise<VizConfig | undefined> {
  const itemPath = path.join(RANKING_ROOT, rankingKey, "item.json");
  let raw: string;
  try {
    raw = await fs.readFile(itemPath, "utf8");
  } catch {
    return undefined;
  }
  try {
    const parsed = JSON.parse(raw) as {
      item?: {
        visualization?: {
          colorScheme?: string;
          colorSchemeType?: string;
          divergingMidpointValue?: number;
        };
      };
    };
    const vc = parsed.item?.visualization;
    if (!vc?.colorScheme) return undefined;
    return {
      colorScheme: vc.colorScheme,
      colorSchemeType: vc.colorSchemeType as VizConfig["colorSchemeType"],
      divergingMidpointValue: vc.divergingMidpointValue,
    };
  } catch {
    return undefined;
  }
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
  rankingDir: string
): Promise<{ light: SnsProps; ig: SnsProps } | null> {
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

    // R2 ranking item.json の visualization からカラースキームを取得
    const rankingKey = path.basename(rankingDir);
    const vizConfig = await loadVizConfig(rankingKey);
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
  props: { light: SnsProps; ig: SnsProps }
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

  if (!stillsOnly && !noteOnly) {
    // Videos
    jobs.push(
      {
        type: "video",
        compositionId: "RankingInstagram-Reel",
        outputPath: path.join(rankingDir, "instagram/stills/reel.mp4"),
        label: "ig/reel.mp4",
        inputProps: props.ig as unknown as Record<string, unknown>,
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
    ? noteOnly ? "note stills only" : "stills only"
    : videosOnly
      ? "videos only"
      : noteOnly ? "note stills only" : "stills + videos";
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

  // visualization は各 ranking の item.json (.item.visualization) から
  // loadProps 内で都度読み込む（完全DBレス）。

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

      const props = await loadProps(rankingDir);
      if (!props) {
        console.log("   ⏭️  data.json が見つからないためスキップ");
        totalSkip++;
        continue;
      }

      // ディレクトリ準備
      await Promise.all([
        fs.mkdir(path.join(rankingDir, "instagram/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "x/stills"), { recursive: true }),
        fs.mkdir(path.join(rankingDir, "note/images"), { recursive: true }),
      ]);

      const jobs = buildJobs(rankingDir, props).filter(
        (job) => !noteOnly || job.label.startsWith("note/"),
      );

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
