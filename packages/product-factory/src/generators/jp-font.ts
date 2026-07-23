/**
 * NotoSansJP (400 Regular) の .ttf バイト列を解決する共有ヘルパー。
 * pdf-lib での日本語 subset 埋め込みに使う。
 */
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { createRequire } from "node:module";

const localRequire = createRequire(import.meta.url);

export function notoSansJpBytes(): Uint8Array {
  const candidates: string[] = [];
  try {
    candidates.push(localRequire.resolve("@expo-google-fonts/noto-sans-jp/400Regular/NotoSansJP_400Regular.ttf"));
  } catch {
    /* fall through */
  }
  try {
    const pkg = localRequire.resolve("@expo-google-fonts/noto-sans-jp/package.json");
    candidates.push(resolve(dirname(pkg), "400Regular/NotoSansJP_400Regular.ttf"));
  } catch {
    /* fall through */
  }
  const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), "../../../..");
  candidates.push(resolve(repoRoot, "node_modules/@expo-google-fonts/noto-sans-jp/400Regular/NotoSansJP_400Regular.ttf"));
  for (const c of candidates) if (existsSync(c)) return readFileSync(c);
  throw new Error("NotoSansJP フォント (.ttf) が見つかりません");
}
