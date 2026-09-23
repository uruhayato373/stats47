#!/usr/bin/env tsx
/**
 * render-ig-compare-carousel.ts — build-ig-compare-props.ts が書き出した props.json から
 * Instagram「県どうしの比較」カルーセル (4:5・4枚。Composition `CompareCarouselInstagram-Carousel`)
 * の静止画を Remotion でレンダリングし、caption.txt を書き出す。
 *
 * props JSON の生成 (R2 fetch・選定・fail-closed 検証) は build-ig-compare-props.ts が担う。
 * このスクリプトはレンダリングと caption 書き出しだけを行う (責務分離)。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/render-ig-compare-carousel.ts 13000-vs-27000 \
 *     [--browser-executable <path>]
 *
 * 入力既定: .local/r2/sns/compare-carousel/<pairKey>/instagram/props.json
 * 出力: .local/r2/sns/compare-carousel/<pairKey>/instagram/{stills/slide-<n>-<role>-1080x1350.png,caption.txt}
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildCompareCaption, tallyWins, type CompareDuelItem } from "./lib/ig-compare-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const REMOTION_DIR = join(PROJECT_ROOT, "apps/remotion");
const COMPOSITION_ID = "CompareCarouselInstagram-Carousel";
/** apps/remotion/src/features/compare-carousel-instagram/types.ts の COMPARE_CAROUSEL_SLIDES と対応 (表示順) */
const COMPARE_CAROUSEL_SLIDES = ["cover", "duel", "summary", "outro"] as const;

function parseArgs() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((v) => !v.startsWith("--"));
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  if (!positional[0]) {
    console.error("✗ pairKey を指定してください (例: 13000-vs-27000)");
    process.exit(1);
  }
  return { pairKey: positional[0], browserExecutable: val("--browser-executable") };
}

interface CompareCarouselDataLike {
  areaAName: string;
  areaBName: string;
  items: CompareDuelItem[];
}

function main() {
  const { pairKey, browserExecutable } = parseArgs();
  const baseDir = join(PROJECT_ROOT, ".local/r2/sns/compare-carousel", pairKey, "instagram");
  const propsPath = join(baseDir, "props.json");
  if (!existsSync(propsPath)) {
    console.error(`✗ props.json が見つかりません: ${propsPath} (先に build-ig-compare-props.ts を実行)`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(propsPath, "utf-8")) as CompareCarouselDataLike;

  const stillsDir = join(baseDir, "stills");
  mkdirSync(stillsDir, { recursive: true });

  let i = 1;
  for (const slide of COMPARE_CAROUSEL_SLIDES) {
    const outPath = join(stillsDir, `slide-${i}-${slide}-1080x1350.png`);
    const propsArg = JSON.stringify({ slide, data });
    const args = [
      "remotion",
      "still",
      "src/index.ts",
      COMPOSITION_ID,
      outPath,
      `--props=${propsArg}`,
      ...(browserExecutable ? [`--browser-executable=${browserExecutable}`] : []),
    ];
    console.error(`→ ${slide}: ${outPath}`);
    execFileSync("npx", args, { cwd: REMOTION_DIR, stdio: "inherit" });
    i += 1;
  }

  const summary = tallyWins(data.items);
  const caption = buildCompareCaption({
    areaAName: data.areaAName,
    areaBName: data.areaBName,
    items: data.items,
    summary,
  });
  writeFileSync(join(baseDir, "caption.txt"), caption, "utf-8");
  console.error(`✓ caption.txt を書き出しました (${caption.length}字)`);
}

main();
