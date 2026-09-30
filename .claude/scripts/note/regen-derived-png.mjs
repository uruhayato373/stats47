#!/usr/bin/env node
/**
 * docs/31 の派生 PNG を SVG から再生成する (git に PNG を置かないための復元口)。
 * 変換は共通実装 .claude/scripts/lib/svg-to-png.cjs に一本化されている。
 *
 *   node .claude/scripts/note/regen-derived-png.mjs --slug <記事ディレクトリ名>   # 無い PNG だけ作る
 *   node .claude/scripts/note/regen-derived-png.mjs --all                        # 全記事
 *   node .claude/scripts/note/regen-derived-png.mjs --slug <s> --force           # 既存も作り直す
 *   node .claude/scripts/note/regen-derived-png.mjs --all --check                # 作らず「無い PNG」の件数だけ数える
 *
 * 公開前 (publish-note / sync-note-r2) と、clone 直後に本文の画像を見たいときに使う。
 */
import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS31_DIR = join(ROOT, "docs", "31_note記事原稿");
const require = createRequire(import.meta.url);

function walk(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

/**
 * slug ディレクトリ内で PNG が無い (または --force) SVG のうち、記事の Markdown が PNG として参照するものを返す。
 * 参照されない SVG (作業用の中間図など) から PNG を量産しない。
 */
export function pendingSvgs(slugDir, { force = false } = {}) {
  const files = walk(slugDir);
  const markdown = files.filter((file) => file.endsWith(".md")).map((file) => readFileSync(file, "utf8")).join("\n");
  return files
    .filter((file) => file.endsWith(".svg"))
    .filter((svg) => markdown.includes(`${svg.split("/").pop().replace(/\.svg$/, "")}.png`))
    .filter((svg) => force || !existsSync(svg.replace(/\.svg$/, ".png")));
}

export async function regenerateSlug(slug, options = {}) {
  const slugDir = join(DOCS31_DIR, slug);
  if (!existsSync(slugDir)) throw new Error(`記事ディレクトリが無い: ${slug}`);
  const { svgToPng } = require(join(ROOT, ".claude/scripts/lib/svg-to-png.cjs"));
  const done = [];
  for (const svg of pendingSvgs(slugDir, options)) {
    if (options.check) {
      done.push(svg);
      continue;
    }
    await svgToPng(svg, svg.replace(/\.svg$/, ".png"));
    done.push(svg);
  }
  return done;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const argv = process.argv.slice(2);
  const flag = (name) => argv.includes(name);
  const slugIndex = argv.indexOf("--slug");
  const slugs = flag("--all")
    ? readdirSync(DOCS31_DIR).filter((name) => statSync(join(DOCS31_DIR, name)).isDirectory())
    : slugIndex >= 0 && argv[slugIndex + 1]
      ? [argv[slugIndex + 1]]
      : [];
  if (slugs.length === 0) {
    console.error("Usage: regen-derived-png.mjs (--slug <dir> | --all) [--force] [--check]");
    process.exit(2);
  }
  let total = 0;
  for (const slug of slugs) {
    const done = await regenerateSlug(slug, { force: flag("--force"), check: flag("--check") });
    total += done.length;
  }
  console.log(`${flag("--check") ? "再生成が必要な SVG" : "再生成した PNG"}: ${total} 枚 (${slugs.length} 記事を走査)`);
  process.exitCode = flag("--check") && total > 0 ? 1 : 0;
}
