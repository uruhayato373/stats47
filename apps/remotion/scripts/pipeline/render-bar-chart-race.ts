#!/usr/bin/env tsx
/**
 * Bar Chart Race 動画 一括生成
 *
 * .local/r2/sns/bar-chart-race/ 配下の全ディレクトリを走査し、
 * YouTube Shorts / Instagram Reel / TikTok の動画を生成する。
 *
 * 前提:
 *   - config.json, data.json が各ディレクトリに存在すること
 *
 * 出力先: .local/r2/sns/bar-chart-race/{rankingKey}/{platform}/shorts.mp4
 *
 * 実行: npm run pipeline:bar-chart-race --workspace remotion
 *
 * オプション:
 *   --key <key>         特定のランキングキーのみ処理
 *   --platform <p>      特定プラットフォームのみ (youtube / instagram / tiktok)
 *   --dry-run           レンダリングせずジョブ一覧を表示
 */

import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";

// ---------------------------------------------------------
// 設定
// ---------------------------------------------------------

const MONOREPO_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const BCR_ROOT = path.join(MONOREPO_ROOT, ".local", "r2", "sns", "bar-chart-race");
const BROWSER_RESTART_INTERVAL = 5; // 動画は重いので頻繁にリスタート

// タイムライン計算（bar-chart-race.ts と同じロジック）
const SCENE_INTRO = 120;
const SCENE_LAST = 150;
const SPOILER_DURATION = 60;
const DEFAULT_FRAMES_PER_YEAR = 36;
const DEFAULT_END_HOLD_FRAMES = 90; // 最終年度固定表示 (3秒)

function calcTotalDuration(frameCount: number, enableSpoilerHook = false): number {
  const spoiler = enableSpoilerHook ? SPOILER_DURATION : 0;
  const raceDuration = Math.max(0, frameCount - 1) * DEFAULT_FRAMES_PER_YEAR + DEFAULT_END_HOLD_FRAMES;
  return spoiler + SCENE_INTRO + raceDuration + SCENE_LAST;
}

// ---------------------------------------------------------
// 引数解析
// ---------------------------------------------------------

const args = process.argv.slice(2);
const keyIdx = args.indexOf("--key");
const targetKey = keyIdx !== -1 ? args[keyIdx + 1] : undefined;
const platformIdx = args.indexOf("--platform");
const targetPlatform = platformIdx !== -1 ? args[platformIdx + 1] : undefined;
const dryRun = args.includes("--dry-run");

// ---------------------------------------------------------
// 型定義
// ---------------------------------------------------------

interface BcrConfig {
  title: string;
  unit: string;
  hookText: string;
  eventLabels: Array<{ year: string; label: string }>;
  enableSpoilerHook?: boolean;
  colorScheme?: string;
}

interface BcrData {
  frames: Array<{
    date: string;
    items: Array<{ name: string; value: number }>;
  }>;
}

interface VideoJob {
  compositionId: string;
  outputPath: string;
  label: string;
  inputProps: Record<string, unknown>;
  durationInFrames: number;
}

// ---------------------------------------------------------
// Props 生成
// ---------------------------------------------------------

async function loadBcrData(
  dir: string
): Promise<{ config: BcrConfig; data: BcrData } | null> {
  try {
    const config: BcrConfig = JSON.parse(
      await fs.readFile(path.join(dir, "config.json"), "utf8")
    );
    const data: BcrData = JSON.parse(
      await fs.readFile(path.join(dir, "data.json"), "utf8")
    );
    return { config, data };
  } catch {
    return null;
  }
}

function buildInputProps(
  config: BcrConfig,
  variant: "youtube" | "instagram" | "tiktok"
): Record<string, unknown> {
  return {
    theme: "dark",
    variant,
    topN: 15,
    showSafeAreas: false,
    frames: config.enableSpoilerHook ? undefined : undefined, // set separately
    title: config.title,
    unit: config.unit,
    hookText: config.hookText,
    eventLabels: config.eventLabels,
    enableSpoilerHook: config.enableSpoilerHook ?? false,
    colorScheme: config.colorScheme,
  };
}

// ---------------------------------------------------------
// ジョブ構築
// ---------------------------------------------------------

const PLATFORM_CONFIG: Array<{
  platform: string;
  variant: "youtube" | "instagram" | "tiktok";
  compositionId: string;
  outputFile: string;
}> = [
  {
    platform: "youtube",
    variant: "youtube",
    compositionId: "BarChartRace-YouTubeShort",
    outputFile: "youtube/shorts.mp4",
  },
  {
    platform: "instagram",
    variant: "instagram",
    compositionId: "BarChartRace-InstagramReel",
    outputFile: "instagram/reel.mp4",
  },
  {
    platform: "tiktok",
    variant: "tiktok",
    compositionId: "BarChartRace-TikTok",
    outputFile: "tiktok/reel.mp4",
  },
  {
    platform: "x",
    variant: "youtube",
    compositionId: "BarChartRace-YouTubeShort",
    outputFile: "x/video.mp4",
  },
  {
    platform: "youtube-normal",
    variant: "youtube",
    compositionId: "BarChartRace-Normal",
    outputFile: "youtube-normal/video.mp4",
  },
];

function buildJobs(
  dir: string,
  key: string,
  config: BcrConfig,
  data: BcrData
): VideoJob[] {
  const platforms = targetPlatform
    ? PLATFORM_CONFIG.filter((p) => p.platform === targetPlatform)
    : PLATFORM_CONFIG;

  const durationInFrames = calcTotalDuration(
    data.frames.length,
    config.enableSpoilerHook
  );

  return platforms.map((p) => ({
    compositionId: p.compositionId,
    outputPath: path.join(dir, p.outputFile),
    label: `${key} → ${p.outputFile}`,
    inputProps: {
      ...buildInputProps(config, p.variant),
      frames: data.frames,
    },
    durationInFrames,
  }));
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

async function main() {
  console.log("🎬 Bar Chart Race Batch Renderer");
  console.log("======================================================\n");

  // ディレクトリ一覧
  let dirs: string[];
  try {
    const entries = await fs.readdir(BCR_ROOT, { withFileTypes: true });
    dirs = entries
      .filter((e) => e.isDirectory())
      .map((e) => e.name)
      .filter((name) => !targetKey || name === targetKey)
      .sort();
  } catch {
    console.error(`❌ ディレクトリが見つかりません: ${BCR_ROOT}`);
    process.exit(1);
  }

  if (dirs.length === 0) {
    console.log(
      targetKey
        ? `❌ キー "${targetKey}" が見つかりません`
        : "❌ ディレクトリがありません"
    );
    process.exit(1);
  }

  // 全ジョブ収集
  const allJobs: VideoJob[] = [];
  const skipped: string[] = [];

  for (const key of dirs) {
    const dir = path.join(BCR_ROOT, key);
    const loaded = await loadBcrData(dir);
    if (!loaded) {
      skipped.push(key);
      continue;
    }
    const jobs = buildJobs(dir, key, loaded.config, loaded.data);
    allJobs.push(...jobs);
  }

  const platforms = targetPlatform || "youtube/instagram/tiktok";
  console.log(`📂 対象: ${dirs.length - skipped.length} ランキング (${platforms})`);
  console.log(`🎬 ジョブ数: ${allJobs.length}`);
  if (skipped.length > 0) {
    console.log(`⏭️  スキップ: ${skipped.join(", ")} (data.json なし)`);
  }
  console.log();

  // ジョブ一覧
  for (const job of allJobs) {
    const sec = Math.round(job.durationInFrames / 30);
    console.log(`  ${job.label} (${job.durationInFrames} frames, ~${sec}s)`);
  }
  console.log();

  if (dryRun) {
    console.log("🏁 Dry run — レンダリングは実行しません");
    return;
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

  let success = 0;
  let fail = 0;
  const startTime = Date.now();

  try {
    for (let i = 0; i < allJobs.length; i++) {
      const job = allJobs[i];

      // ブラウザ定期再起動
      if (i > 0 && i % BROWSER_RESTART_INTERVAL === 0) {
        await browser.close({ silent: true });
        browser = await openBrowser("chrome");
        console.log(`♻️  Chrome restarted\n`);
      }

      console.log(`[${i + 1}/${allJobs.length}] 🎬 ${job.label}`);

      try {
        // 出力ディレクトリ作成
        await fs.mkdir(path.dirname(job.outputPath), { recursive: true });

        const composition = await selectComposition({
          serveUrl: bundleUrl,
          id: job.compositionId,
          inputProps: job.inputProps,
          puppeteerInstance: browser,
        });

        // durationInFrames をデータに合わせて上書き
        composition.durationInFrames = job.durationInFrames;

        await renderMedia({
          serveUrl: bundleUrl,
          composition,
          outputLocation: job.outputPath,
          inputProps: job.inputProps,
          codec: "h264",
          puppeteerInstance: browser,
        });

        const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1);
        console.log(`   ✅ 完了 (経過: ${elapsed}min)\n`);
        success++;
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.log(`   ❌ 失敗: ${msg.slice(0, 200)}\n`);
        fail++;
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  const totalMin = ((Date.now() - startTime) / 1000 / 60).toFixed(1);

  console.log("\n📊 Summary");
  console.log("==========");
  console.log(`✅ 成功: ${success}`);
  console.log(`❌ 失敗: ${fail}`);
  console.log(`⏱️  合計: ${totalMin} min`);
  console.log("\n🏁 Bar Chart Race batch rendering completed!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
