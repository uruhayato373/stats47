#!/usr/bin/env node
/**
 * AI で描く画像の生成を config/image-generation-routes.json の経路だけに保つ検査 (2026-11-06 オーナー依頼)。
 *
 * 画像 API を直接呼ぶコードが登録の無い場所に増えたら止める。Codex imagegen は Codex 側で動くのでコードに呼び出しが
 * 現れない。ここで止めるのは Gemini・Stable Diffusion・OpenAI Images などの API を直接呼ぶ経路である。
 * legacy は撤去待ちの既存コードだけを許す (削除条件: 撤去カードの完了)。撤去カードが backlog に無ければ止める。
 *
 *   node .claude/scripts/lib/check-image-generation-routes.mjs
 */
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

export const DIRECT_IMAGE_API = /responseModalities|flash-image|imagen-[0-9]|stable-diffusion|stabilityai|images\/generations|images\.generate|dall-e-[0-9]/i;
const SOURCE = /\.(?:ts|tsx|mjs|cjs|js|sh|ya?ml)$/;
const SELF = /(?:^|\/)(?:check-image-generation-routes\.mjs|check-image-generation-routes\.test\.mjs)$/;
const TEST_FILE = /(?:__tests__\/|\.test\.)/;

/** files: [{ path, text }]。config: 経路の登録。backlog: backlog.md の本文。exists: パスの存在判定。 */
export function auditImageRoutes({ files, config, backlog, exists }) {
  const errors = [];
  const legacy = new Set(config.legacy.map((entry) => entry.path));
  for (const { path, text } of files) {
    if (SELF.test(path) || TEST_FILE.test(path) || !SOURCE.test(path) || legacy.has(path)) continue;
    if (DIRECT_IMAGE_API.test(text)) errors.push(`${path}: 登録の無い画像 API の直接呼び出し。AI で描く画像は Codex の経路を使う`);
  }
  for (const route of [...config.routes, ...config.deterministicRoutes]) {
    if (!exists(route.entry)) errors.push(`${route.id}: 入口 ${route.entry} が無い`);
  }
  for (const entry of config.legacy) {
    if (!exists(entry.path)) errors.push(`legacy ${entry.path}: 撤去済みなので登録から外す`);
    if (!backlog.includes(`[${entry.removalCard}]`)) errors.push(`legacy ${entry.path}: 撤去カード ${entry.removalCard} が backlog に無い`);
  }
  return errors;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
  const read = (path) => readFileSync(resolve(root, path), "utf8");
  const tracked = execFileSync("git", ["ls-files"], { cwd: root, encoding: "utf8", maxBuffer: 1 << 28 }).split("\n");
  const files = tracked
    .filter((path) => SOURCE.test(path) && !path.startsWith("data/") && !path.startsWith("contents/") && existsSync(resolve(root, path)))
    .map((path) => ({ path, text: read(path) }));
  const errors = auditImageRoutes({
    files,
    config: JSON.parse(read("config/image-generation-routes.json")),
    backlog: read(".claude/todo/backlog.md"),
    exists: (path) => existsSync(resolve(root, path)),
  });
  for (const error of errors) console.error(`✗ ${error}`);
  if (errors.length) process.exit(1);
  console.log(`✓ image routes: ${files.length} ファイルを検査`);
}
