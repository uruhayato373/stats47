#!/usr/bin/env node
/**
 * 生成 AI (imagegen / Codex) で作った note カバーの背景を取り込む。契約: .claude/rules/note-image-assets.md
 * 画像生成は意味判断、ここでは寸法・形式・SHA を決定的に保証し、render-spec.json の background に固定する。
 * 文字・数値・地図は生成画像に含めない (テンプレートが実テキスト/実データで重ねる)。
 *
 *   # 1. 候補を Drive (非公開) へ置く。R2 には載せない
 *   node .claude/scripts/note/ingest-note-background.mjs --slug a-<key> --input /abs/generated.png --stash
 *   # 2. 採用するものを正規化 (1280x670 JPEG) して R2 用に stage し、render-spec.json へ固定する
 *   node .claude/scripts/note/ingest-note-background.mjs --slug a-<key> --input drive:a-<key>/<ファイル名> \\
 *        --model "<モデル名>" --prompt "<指示文>" --write-spec
 *   # 3. R2 へ反映 (CI/書込権限のある環境。明示キーだけ): push-exact-r2-assets.ts --prefix media/note-backgrounds/<slug>
 *   # 4. 画像を作り直す: node .claude/scripts/note/render-ranking-images.mjs <key>
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { createRequire } from "node:module";
import { basename, dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { noteCandidatesDir, resolveDriveInput } from "./lib/drive-assets.mjs";
import { NOTE_BACKGROUND_HEIGHT, NOTE_BACKGROUND_WIDTH, noteBackgroundR2Key, validateBackground } from "./lib/note-render-spec.mjs";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const require = createRequire(import.meta.url);
const argv = process.argv.slice(2);
const arg = (name) => {
  const i = argv.indexOf(`--${name}`);
  return i >= 0 ? argv[i + 1] : undefined;
};
const flag = (name) => argv.includes(`--${name}`);

async function main() {
  const slug = arg("slug");
  const input = arg("input");
  if (!slug || !/^a-[a-z0-9-]+$/.test(slug) || !input) throw new Error("--slug a-<rankingKey> と --input は必須");
  const source = input.startsWith("drive:") ? await resolveDriveInput(input) : resolve(input);
  if (!existsSync(source)) throw new Error(`入力画像が無い: ${source}`);

  if (flag("stash")) {
    const dir = await noteCandidatesDir(slug, { create: true });
    const target = join(dir, `${new Date().toISOString().slice(0, 10)}-${basename(source)}`);
    if (existsSync(target)) throw new Error(`同名の候補が既にある (上書きしない): ${target}`);
    copyFileSync(source, target);
    console.log(JSON.stringify({ status: "stashed-private", slug, path: target, drivePath: `drive:${slug}/${basename(target)}` }, null, 2));
    return;
  }

  const sharp = require("sharp");
  const normalized = await sharp(source)
    .resize(NOTE_BACKGROUND_WIDTH, NOTE_BACKGROUND_HEIGHT, { fit: "cover", position: "centre" })
    .flatten({ background: "#ffffff" })
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4" })
    .toBuffer();
  const sha256 = createHash("sha256").update(normalized).digest("hex");
  const r2Key = noteBackgroundR2Key(slug, sha256);
  const staged = join(ROOT, ".local/r2", ...r2Key.split("/"));
  mkdirSync(dirname(staged), { recursive: true });
  writeFileSync(staged, normalized);
  // 作り直し時の取得先。R2 (公開後) が無い間もここから読める
  const cache = join(ROOT, ".local/note-backgrounds", `${sha256}.jpg`);
  mkdirSync(dirname(cache), { recursive: true });
  writeFileSync(cache, normalized);

  const background = {
    status: "approved",
    source: "imagegen",
    model: arg("model") ?? "",
    prompt: arg("prompt") ?? "",
    sha256,
    bytes: normalized.byteLength,
    width: NOTE_BACKGROUND_WIDTH,
    height: NOTE_BACKGROUND_HEIGHT,
    r2Key,
  };
  const errors = validateBackground(slug, background);
  if (flag("write-spec")) {
    if (errors.length) throw new Error(`spec に書けない: ${errors.join(" / ")}`);
    const specPath = join(ROOT, "docs/31_note記事原稿", slug, "render-spec.json");
    if (!existsSync(specPath)) throw new Error(`render-spec.json が無い (先に render-ranking-images.mjs): ${specPath}`);
    const spec = JSON.parse(readFileSync(specPath, "utf8"));
    writeFileSync(specPath, `${JSON.stringify({ ...spec, background }, null, 2)}\n`);
  }
  console.log(JSON.stringify({ status: flag("write-spec") ? "spec-updated-r2-push-pending" : "staged-unpublished", slug, staged, r2Key, sha256, problems: errors }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
