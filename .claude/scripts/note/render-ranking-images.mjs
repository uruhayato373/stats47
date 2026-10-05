#!/usr/bin/env node
/**
 * ランキング note 記事の画像 4 枚 (cover / choropleth / chart / boxplot) を chart-data.json から作り直す。
 * 入力は記事ディレクトリの chart-data.json だけ。R2 や .local のデータは読まない。契約: .claude/rules/note-image-assets.md
 *
 *   node .claude/scripts/note/render-ranking-images.mjs <rankingKey | a-slug>     # 1 記事
 *   node .claude/scripts/note/render-ranking-images.mjs --all                      # 全ランキング記事
 *   node .claude/scripts/note/render-ranking-images.mjs --stale                    # render-spec が古い記事だけ
 *   node .claude/scripts/note/render-ranking-images.mjs <key> --check              # 作らず、spec が有効かだけ確かめる
 *
 * 成功すると images/*.png と render-spec.json を書く。PNG は git に載らない (gitignore)。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync, copyFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { NOTE_RANKING_IMAGES, buildRenderProps, buildRenderSpec, validateRenderSpec } from "./lib/note-render-spec.mjs";
import { isRankingArticleSlug } from "./lib/image-assets-audit.mjs";
import { R2_PUBLIC_BASE_URL } from "../lib/site-config.cjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS31 = join(ROOT, "docs", "31_note記事原稿");
const REMOTION = join(ROOT, "apps", "remotion");
const argv = process.argv.slice(2);
const flag = (name) => argv.includes(name);

const CHROME_CANDIDATES = [
  "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  "C:/Program Files/Google/Chrome/Application/chrome.exe",
];

function pngSize(file) {
  const data = readFileSync(file);
  if (data.length < 24 || data.subarray(1, 4).toString("ascii") !== "PNG") throw new Error(`PNG ではない: ${file}`);
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
}

function slugsToProcess() {
  const all = readdirSync(DOCS31).filter((name) => isRankingArticleSlug(name) && existsSync(join(DOCS31, name, "chart-data.json")));
  if (flag("--all") || flag("--stale")) return all;
  const target = argv.find((arg) => !arg.startsWith("--"));
  if (!target) {
    console.error("Usage: render-ranking-images.mjs (<rankingKey> | --all | --stale) [--check]");
    process.exit(2);
  }
  const slug = target.startsWith("a-") ? target : `a-${target}`;
  if (!all.includes(slug)) {
    console.error(`ランキング記事が見つからない (chart-data.json が無い): ${slug}`);
    process.exit(2);
  }
  return [slug];
}

function specErrors(slug) {
  const dir = join(DOCS31, slug);
  const chartText = readFileSync(join(dir, "chart-data.json"), "utf8");
  const specPath = join(dir, "render-spec.json");
  if (!existsSync(specPath)) return ["render-spec.json が無い"];
  return validateRenderSpec(slug, JSON.parse(readFileSync(specPath, "utf8")), chartText);
}

const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;

/**
 * 生成 AI の背景 (render-spec.json の background) を取得して SHA を検証し data URI にする。
 * 取得順: ローカル cache (.local/note-backgrounds/<sha>.jpg) → R2。SHA が合わなければ画像を作らずに止める
 * (別の背景で画像を焼いてしまうのを防ぐ)。生成 AI は再実行しない。
 */
async function loadBackground(background) {
  const cache = join(ROOT, ".local/note-backgrounds", `${background.sha256}.jpg`);
  let data = existsSync(cache) ? readFileSync(cache) : null;
  if (!data) {
    const res = await fetch(`${R2_BASE}/${background.r2Key}`);
    if (!res.ok) throw new Error(`背景を取得できない (HTTP ${res.status}): ${background.r2Key}。R2 へ未反映なら ingest-note-background.mjs の手順 3 を先に行う`);
    data = Buffer.from(await res.arrayBuffer());
    mkdirSync(dirname(cache), { recursive: true });
    writeFileSync(cache, data);
  }
  const actual = createHash("sha256").update(data).digest("hex");
  if (actual !== background.sha256) throw new Error(`背景の SHA が spec と不一致: ${actual} (spec ${background.sha256})`);
  return `data:image/jpeg;base64,${data.toString("base64")}`;
}

async function render(slug) {
  const dir = join(DOCS31, slug);
  const chartText = readFileSync(join(dir, "chart-data.json"), "utf8");
  const chartData = JSON.parse(chartText);
  const specPath = join(dir, "render-spec.json");
  const background = existsSync(specPath) ? JSON.parse(readFileSync(specPath, "utf8")).background : undefined;
  const backgroundImage = background ? await loadBackground(background) : undefined;
  if (typeof chartData.unit !== "string") throw new Error(`${slug}: chart-data.json に unit が無い`);
  const work = mkdtempSync(join(tmpdir(), `note-render-${slug}-`));
  try {
    const propsPath = join(work, "props.json");
    writeFileSync(propsPath, JSON.stringify(buildRenderProps(chartData, backgroundImage)));
    const chrome = CHROME_CANDIDATES.find((candidate) => existsSync(candidate));
    const outputs = [];
    for (const image of NOTE_RANKING_IMAGES) {
      const out = join(work, image.file.split("/").pop());
      const args = ["remotion", "still", "src/index.ts", image.composition, out, `--props=${propsPath}`, "--log=error"];
      if (chrome && process.platform === "win32") args.push(`--browser-executable=${chrome}`);
      execFileSync("npx", args, { cwd: REMOTION, stdio: ["ignore", "inherit", "inherit"], env: { ...process.env, MSYS_NO_PATHCONV: "1" } });
      const [w, h] = pngSize(out);
      if (w !== image.width || h !== image.height) throw new Error(`${slug} ${image.file}: 寸法 ${w}x${h} (期待 ${image.width}x${image.height})`);
      outputs.push([out, image.file]);
    }
    // 4 枚すべて成功してから書く。途中で失敗しても、公開時の画像を半端に壊さない
    mkdirSync(join(dir, "images"), { recursive: true });
    for (const [out, file] of outputs) copyFileSync(out, join(dir, file));
    writeFileSync(join(dir, "render-spec.json"), `${JSON.stringify(buildRenderSpec(slug, chartText, background), null, 2)}\n`);
  } finally {
    rmSync(work, { recursive: true, force: true });
  }
}

let failed = 0;
let done = 0;
for (const slug of slugsToProcess()) {
  const errors = specErrors(slug);
  if (flag("--check")) {
    if (errors.length) {
      failed += 1;
      console.error(`✗ ${slug}: ${errors.join(" / ")}`);
    }
    continue;
  }
  if (flag("--stale") && errors.length === 0) continue;
  try {
    await render(slug);
    done += 1;
    console.log(`✓ ${slug}`);
  } catch (error) {
    failed += 1;
    console.error(`✗ ${slug}: ${error instanceof Error ? error.message : String(error)}`);
  }
}
console.log(flag("--check") ? `spec 検査: 無効 ${failed} 件` : `作り直し ${done} 件 / 失敗 ${failed} 件`);
process.exitCode = failed ? 1 : 0;
