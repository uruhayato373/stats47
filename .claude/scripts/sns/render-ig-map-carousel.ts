#!/usr/bin/env tsx
/**
 * render-ig-map-carousel.ts — build-ig-map-props.ts が書き出した props.json から
 * Instagram「地図」カルーセル (4:5・4枚。Composition `MapCarouselInstagram-Carousel`) の
 * 静止画を Remotion でレンダリングし、caption.txt を書き出す。
 *
 * props JSON の生成 (R2 fetch・塗り分け・fail-closed 検証) は build-ig-map-props.ts が担う。
 * このスクリプトはレンダリングと caption 書き出しだけを行う (責務分離)。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/render-ig-map-carousel.ts shochu-consumption-expenditure \
 *     [--browser-executable <path>]
 *
 * 入力既定: .local/r2/sns/map-carousel/<rankingKey>/instagram/props.json
 * 出力: .local/r2/sns/map-carousel/<rankingKey>/instagram/{stills/slide-<n>-<role>-1080x1350.png,caption.txt}
 */
import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

import { buildMapCaption, type TileCandidate } from "./lib/ig-map-props.ts";

const PROJECT_ROOT = join(import.meta.dirname ?? __dirname, "../../..");
const REMOTION_DIR = join(PROJECT_ROOT, "apps/remotion");
const COMPOSITION_ID = "MapCarouselInstagram-Carousel";
/** apps/remotion/src/features/map-carousel-instagram/types.ts の MAP_CAROUSEL_SLIDES と対応 (表示順) */
const MAP_CAROUSEL_SLIDES = ["cover", "choropleth", "topbottom", "outro"] as const;

function parseArgs() {
  const argv = process.argv.slice(2);
  const positional = argv.filter((v) => !v.startsWith("--"));
  const val = (name: string): string | null => {
    const i = argv.indexOf(name);
    return i !== -1 ? (argv[i + 1] ?? null) : null;
  };
  if (!positional[0]) {
    console.error("✗ rankingKey を指定してください (例: shochu-consumption-expenditure)");
    process.exit(1);
  }
  return { rankingKey: positional[0], browserExecutable: val("--browser-executable") };
}

interface MapCarouselDataLike {
  label: string;
  unit: string;
  year: number;
  source: string;
  top5: TileCandidate[];
  bottom5: TileCandidate[];
}

function main() {
  const { rankingKey, browserExecutable } = parseArgs();
  const baseDir = join(PROJECT_ROOT, ".local/r2/sns/map-carousel", rankingKey, "instagram");
  const propsPath = join(baseDir, "props.json");
  if (!existsSync(propsPath)) {
    console.error(`✗ props.json が見つかりません: ${propsPath} (先に build-ig-map-props.ts を実行)`);
    process.exit(1);
  }
  const data = JSON.parse(readFileSync(propsPath, "utf-8")) as MapCarouselDataLike;

  const stillsDir = join(baseDir, "stills");
  mkdirSync(stillsDir, { recursive: true });

  let i = 1;
  for (const slide of MAP_CAROUSEL_SLIDES) {
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

  const caption = buildMapCaption({
    label: data.label,
    unit: data.unit,
    year: data.year,
    source: data.source,
    top5: data.top5,
    bottom5: data.bottom5,
  });
  writeFileSync(join(baseDir, "caption.txt"), caption, "utf-8");
  console.error(`✓ caption.txt を書き出しました (${caption.length}字)`);
}

main();
