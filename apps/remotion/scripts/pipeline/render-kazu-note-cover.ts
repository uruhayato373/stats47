#!/usr/bin/env tsx
/**
 * kazu-note カバー画像生成
 *
 * 断酒エッセイシリーズの note カバー画像を1枚生成する。
 *
 * 使い方:
 *   npx tsx scripts/pipeline/render-kazu-note-cover.ts \
 *     --series "ソバーキュリアス" \
 *     --day 15 \
 *     --subtitle "自分を馬鹿にしていたのは、自分だった" \
 *     --output "/path/to/output.png"
 *
 * stats47 以外のディレクトリからも実行可能:
 *   cd C:/Users/m004195/stats47/apps/remotion && npx tsx scripts/pipeline/render-kazu-note-cover.ts ...
 */

import { bundle } from "@remotion/bundler";
import {
  openBrowser,
  renderStill,
  selectComposition,
} from "@remotion/renderer";
import path from "path";

// ---------------------------------------------------------
// 引数パース
// ---------------------------------------------------------

function parseArgs(): {
  series: string;
  day: number;
  subtitle: string;
  output: string;
} {
  const args = process.argv.slice(2);
  const map = new Map<string, string>();

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i]?.replace(/^--/, "");
    const value = args[i + 1];
    if (key && value) map.set(key, value);
  }

  const series = map.get("series");
  const day = map.get("day");
  const subtitle = map.get("subtitle");
  const output = map.get("output");

  if (!series || !day || !subtitle || !output) {
    console.error(
      "Usage: render-kazu-note-cover.ts --series <series> --day <day> --subtitle <subtitle> --output <path>"
    );
    process.exit(1);
  }

  return {
    series,
    day: Number(day),
    subtitle,
    output: path.resolve(output),
  };
}

// ---------------------------------------------------------
// メイン
// ---------------------------------------------------------

async function main() {
  const { series, day, subtitle, output } = parseArgs();

  console.log(`kazu-note Cover Generator`);
  console.log(`========================`);
  console.log(`  Series:   ${series}`);
  console.log(`  Day:      ${day}`);
  console.log(`  Subtitle: ${subtitle}`);
  console.log(`  Output:   ${output}\n`);

  const projectRoot = path.resolve(__dirname, "..", "..");
  const srcPath = path.join(projectRoot, "src");

  console.log("Bundling Remotion project...");
  const bundleUrl = await bundle({
    entryPoint: path.join(srcPath, "index.ts"),
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
  console.log("Bundle completed\n");

  const browserExecutable =
    process.platform === "darwin"
      ? "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome"
      : "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe";

  const browser = await openBrowser("chrome", { browserExecutable });

  try {
    const inputProps = { series, day, subtitle };

    const composition = await selectComposition({
      serveUrl: bundleUrl,
      id: "KazuNote-Cover",
      inputProps,
      puppeteerInstance: browser,
    });

    await renderStill({
      serveUrl: bundleUrl,
      composition,
      output,
      inputProps,
      imageFormat: "png",
      puppeteerInstance: browser,
    });

    console.log(`Done: ${output}`);
  } finally {
    await browser.close({ silent: true });
  }
}

main().catch((err) => {
  console.error("Error:", err);
  process.exit(1);
});
