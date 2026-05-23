/**
 * 駅別乗降客数バブルマップ動画を都道府県別・フォーマット別に一括レンダーする。
 *
 * 出力: out/station-passengers/{format}/{prefCode}.mp4
 *   format = landscape (16:9 YouTube/X) / portrait (9:16 Reels) / square (1:1 IG feed)
 *
 * 実行:
 *   tsx scripts/pipeline/render-station-passengers.ts
 *     → 全 47 県 × 3 フォーマット（141 本、時間がかかる）
 *   tsx scripts/pipeline/render-station-passengers.ts portrait
 *     → 全 47 県 × portrait のみ
 *   tsx scripts/pipeline/render-station-passengers.ts portrait 22 13 26
 *     → 指定県 × portrait のみ
 *
 * 前提: apps/remotion/public/station-passengers/{NN}.json / lines-{NN}.json が
 *       生成済み（fetch-station-passengers.ts all / fetch-railway-lines.ts all）。
 */
import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderMedia,
  selectComposition,
} from "@remotion/renderer";
import fs from "fs/promises";
import path from "path";

type Format = "landscape" | "portrait" | "square";

const COMPOSITION_ID: Record<Format, string> = {
  landscape: "StationPassengers-Reel",
  portrait: "StationPassengers-Reel-Portrait",
  square: "StationPassengers-Reel-Square",
};

const ALL_FORMATS: Format[] = ["landscape", "portrait", "square"];
const ALL_PREFS = Array.from({ length: 47 }, (_, i) =>
  String(i + 1).padStart(2, "0"),
);
/** Chrome を定期再起動する間隔（動画レンダーはメモリを食う） */
const BROWSER_RESTART_INTERVAL = 5;

function parseArgs(): { formats: Format[]; prefs: string[] } {
  const args = process.argv.slice(2);
  const formatArg = args[0] as Format | undefined;
  const formats =
    formatArg && ALL_FORMATS.includes(formatArg) ? [formatArg] : ALL_FORMATS;
  const prefArgs = (formatArg ? args.slice(1) : args)
    .map((a) => a.padStart(2, "0"))
    .filter((a) => ALL_PREFS.includes(a));
  return { formats, prefs: prefArgs.length > 0 ? prefArgs : ALL_PREFS };
}

async function main() {
  const { formats, prefs } = parseArgs();
  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");

  interface Job {
    format: Format;
    prefCode: string;
    compositionId: string;
    outputPath: string;
  }
  const jobs: Job[] = [];
  for (const format of formats) {
    for (const prefCode of prefs) {
      jobs.push({
        format,
        prefCode,
        compositionId: COMPOSITION_ID[format],
        outputPath: path.join(
          projectRoot,
          "out/station-passengers",
          format,
          `${prefCode}.mp4`,
        ),
      });
    }
  }

  console.log(
    `📦 Bundling Remotion project... (${jobs.length} 本: ${formats.join("/")} × ${prefs.length} 県)`,
  );
  const bundleUrl = await bundle({
    entryPoint: path.join(srcPath, "index.ts"),
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
  let success = 0;
  let fail = 0;
  const startTime = Date.now();

  try {
    for (let i = 0; i < jobs.length; i++) {
      const job = jobs[i];

      if (i > 0 && i % BROWSER_RESTART_INTERVAL === 0) {
        await browser.close({ silent: true });
        browser = await openBrowser("chrome");
        console.log("♻️  Chrome restarted\n");
      }

      const label = `${job.format}/${job.prefCode}`;
      console.log(`[${i + 1}/${jobs.length}] 🎬 ${label}`);
      try {
        await fs.mkdir(path.dirname(job.outputPath), { recursive: true });
        const inputProps = { prefCode: job.prefCode, format: job.format };
        const composition = await selectComposition({
          serveUrl: bundleUrl,
          id: job.compositionId,
          inputProps,
          puppeteerInstance: browser,
        });
        await renderMedia({
          serveUrl: bundleUrl,
          composition,
          outputLocation: job.outputPath,
          inputProps,
          codec: "h264",
          puppeteerInstance: browser,
        });
        success++;
      } catch (err) {
        fail++;
        console.error(`   ❌ ${label} 失敗:`, err);
      }
    }
  } finally {
    await browser.close({ silent: true });
  }

  const mins = ((Date.now() - startTime) / 60000).toFixed(1);
  console.log(`\n✅ 完了: 成功 ${success} / 失敗 ${fail} (${mins} 分)`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
