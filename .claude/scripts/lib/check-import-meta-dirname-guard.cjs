#!/usr/bin/env node
"use strict";

/**
 * bare な `import.meta.dirname` を検出する決定的チェック。
 *
 * 経緯 (2026-08-16): `packages/r2-storage/src/scripts/purge-worker-cache.ts` が
 *
 *   config({ path: path.resolve(import.meta.dirname, "..", "..", "..", "..", ".env.local") });
 *
 * と書いており、blog-auto-publish と sync-rakuten-catalog の「Purge Workers Cache」step が
 *
 *   TypeError [ERR_INVALID_ARG_TYPE]: The "paths[0]" argument must be of type string.
 *   Received undefined
 *
 * で失敗していた。CDN purge 自体は成功していたので、失われていたのは Workers Cache の purge。
 * W33 で Workers Cache を有効化した直後から、公開した記事が古い HTML のまま残りうる状態だった。
 *
 * ## なぜ undefined になるか
 *
 * このリポジトリの package.json は **どれも `"type": "module"` を持たない**
 * (root / apps/web / packages/*)。よって `.ts` を tsx で実行すると CJS 解決になり、
 * `import.meta.dirname` は undefined。`__dirname` の方が定義されている。
 *
 * repo の他 8 箇所は `import.meta.dirname ?? __dirname` とフォールバックしており、
 * このファイルだけが規約から外れていた。同じ穴を機械で塞ぐのがこのガード。
 *
 * ## 対象と非対象 (実測に基づく分類)
 *
 *   対象   : `.ts` / `.tsx` / `.cts` の非テストファイル
 *            → tsx が CJS 解決するので bare は undefined。`?? __dirname` 必須
 *   非対象 : `.mjs` / `.mts`
 *            → node が真 ESM として実行する。bare が正しく、逆に `__dirname` は存在しない
 *   非対象 : `__tests__/` 配下と `*.test.*`
 *            → vitest / node --test が ESM として解決する。bare で正常動作しており CI green
 *
 * Usage:
 *   node .claude/scripts/lib/check-import-meta-dirname-guard.cjs
 *   node .claude/scripts/lib/check-import-meta-dirname-guard.cjs --json
 */

const fs = require("node:fs");
const path = require("node:path");

const ROOT =
  process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");

/** 走査対象。生成物・依存・ビルド出力は見ない */
const SCAN_ROOTS = [".claude/scripts", "apps", "packages", "scripts"];
const SKIP_DIRS = new Set([
  "node_modules",
  ".next",
  ".open-next",
  "dist",
  "build",
  "coverage",
  ".turbo",
  ".wrangler",
  ".local",
]);

/**
 * CJS 解決になりうる拡張子だけを見る。
 * `.mjs` / `.mts` は真 ESM で bare が正しいので入れない。
 */
const EXTENSIONS = new Set([".ts", ".tsx", ".cts"]);

/** vitest / node --test は ESM 解決するのでテストは対象外 */
function isTestFile(relativePath) {
  return (
    relativePath.includes("__tests__/") ||
    /\.(test|spec)\.[cm]?tsx?$/.test(relativePath)
  );
}

/**
 * フォールバックの無い `import.meta.dirname` を返す純関数。
 *
 * `import.meta.dirname ?? __dirname` のように **同じ行で** null 合体か論理和による
 * フォールバックがあれば違反としない。`import.meta.url` は別物なので対象外。
 */
function findViolations(source) {
  const found = [];
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    // 行コメント内の言及は対象外 (このファイル自身の説明文など)
    const code = line.replace(/\/\/.*$/, "").replace(/^\s*\*.*$/, "");
    if (!/\bimport\.meta\.dirname\b/.test(code)) return;
    // `import.meta.dirname ?? x` / `import.meta.dirname || x` はフォールバック済み
    if (/\bimport\.meta\.dirname\s*(\?\?|\|\|)/.test(code)) return;
    found.push({ line: index + 1, text: line.trim() });
  });
  return found;
}

function walk(dir, out = []) {
  let entries = [];
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name.startsWith(".") && entry.name !== ".claude") continue;
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(absolute);
  }
  return out;
}

function inspect(root = ROOT) {
  const findings = [];
  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(path.join(root, scanRoot))) {
      const relative = path.relative(root, file).split(path.sep).join("/");
      if (isTestFile(relative)) continue;
      for (const violation of findViolations(fs.readFileSync(file, "utf8"))) {
        findings.push({ file: relative, ...violation });
      }
    }
  }
  return findings;
}

if (require.main === module) {
  const findings = inspect();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("✓ bare な import.meta.dirname なし");
  } else {
    for (const f of findings) {
      console.error(`✗ ${f.file}:${f.line} ${f.text}`);
    }
    console.error(
      `\n${findings.length} 件。.ts は tsx が CJS 解決するため import.meta.dirname は undefined になる。` +
        `\n\`import.meta.dirname ?? __dirname\` と書くこと (repo の他 8 箇所と同じ形)。` +
        `\n実害: 2026-08-16 に purge-worker-cache.ts がこれで ERR_INVALID_ARG_TYPE を出し、` +
        `\nblog-auto-publish と sync-rakuten-catalog の Workers Cache purge が失敗していた。`,
    );
  }
  process.exit(findings.length === 0 ? 0 : 1);
}

module.exports = { findViolations, inspect, isTestFile };
