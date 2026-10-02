#!/usr/bin/env node
/**
 * note 公開・更新の直前に、記事の画像 (PNG) が揃っていることを保証する。契約: .claude/rules/note-image-assets.md
 * PNG は git に無いので、clone 直後や restore 直後は存在しない。無ければ作り直し、それでも足りなければ止まる
 * (カバーが無いまま黙って公開する事故を防ぐ。旧 editor-helpers は cover が無いと黙って飛ばしていた)。
 *
 *   node .claude/scripts/note/ensure-note-images.mjs <記事ディレクトリ (docs/31 配下の絶対/相対パス)>
 *   終了コード: 0=揃っている / 1=作り直しても不足 (不足を列挙)
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { basename, dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { regenerateSlug } from "./regen-derived-png.mjs";
import { NOTE_RANKING_IMAGES } from "./lib/note-render-spec.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const DOCS31 = join(ROOT, "docs", "31_note記事原稿");

/** draft.md が参照する images/*.png (コードフェンス外の相対参照) */
export function referencedPngs(markdown) {
  const withoutFences = markdown.replace(/```[\s\S]*?```/g, "");
  return [...withoutFences.matchAll(/!\[[^\]]*\]\((images\/[^)\s]+\.png)\)/g)].map((m) => m[1]);
}

export function missingImages(dir) {
  const draft = existsSync(join(dir, "draft.md")) ? readFileSync(join(dir, "draft.md"), "utf8") : "";
  const wanted = new Set(referencedPngs(draft));
  if (existsSync(join(dir, "render-spec.json"))) for (const image of NOTE_RANKING_IMAGES) wanted.add(image.file);
  return [...wanted].filter((file) => !existsSync(join(dir, file)));
}

export async function ensureNoteImages(dir) {
  let missing = missingImages(dir);
  if (missing.length === 0) return { made: [], missing: [] };
  const slug = basename(dir);
  if (existsSync(join(dir, "render-spec.json"))) {
    execFileSync("node", [join(ROOT, ".claude/scripts/note/render-ranking-images.mjs"), slug], { stdio: "inherit", cwd: ROOT });
  } else {
    await regenerateSlug(relative(DOCS31, dir));
  }
  const made = missing.filter((file) => existsSync(join(dir, file)));
  missing = missingImages(dir);
  return { made, missing };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const target = process.argv[2];
  if (!target) {
    console.error("Usage: ensure-note-images.mjs <記事ディレクトリ>");
    process.exit(2);
  }
  const dir = resolve(target);
  if (!dir.startsWith(DOCS31) || !existsSync(dir)) {
    console.error(`docs/31 配下の記事ディレクトリではない: ${dir}`);
    process.exit(2);
  }
  const { made, missing } = await ensureNoteImages(dir);
  if (made.length) console.log(`作り直した画像: ${made.length} 枚`);
  if (missing.length) {
    console.error(`✗ 画像が足りない (${missing.length} 枚): ${missing.join(", ")}\n  SVG も render-spec.json も無い画像は作れない。restore-from-r2.sh で元の原稿を復元してから再実行する`);
    process.exit(1);
  }
  console.log("✓ 画像は揃っている");
}
