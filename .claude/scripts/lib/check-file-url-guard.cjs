#!/usr/bin/env node
"use strict";

/**
 * file:// URL を文字列連結で組み立てていないかの決定的チェック。
 *
 * 経緯 (2026-08-05): ESM のエントリポイント判定によく使われる
 *
 *   if (import.meta.url === `file://${process.argv[1]}`) main();
 *
 * は Windows で必ず false になる。Node は `process.argv[1]` を絶対パスへ解決するが、
 * Windows では `C:\path\to\x.mjs` の形になり、`file://C:\path\to\x.mjs` は
 * `import.meta.url` の `file:///C:/path/to/x.mjs` と一致しない。
 *
 * 一致しないと main() が呼ばれないまま **exit 0 で終了する**。失敗ではなく
 * 「何もせず成功」に見えるのが最悪で、実際に次の 2 つが起きていた:
 *   - seo-observability MCP サーバーが stdin を読まず handshake 不成立
 *   - metrics / search-growth / blog の CLI 13 本が Windows でローカル実行すると無言で no-op
 *     (record-claude-usage.mjs はトークン実測の唯一の writer)
 *
 * 正しい書き方は URL API を使うこと:
 *
 *   import { pathToFileURL } from "node:url";
 *   if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) main();
 *
 * Usage:
 *   node .claude/scripts/lib/check-file-url-guard.cjs
 *   node .claude/scripts/lib/check-file-url-guard.cjs --json
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
  ".local",
  "__snapshots__",
]);
const EXTENSIONS = new Set([".js", ".cjs", ".mjs", ".ts", ".tsx", ".mts", ".cts"]);

/**
 * 文字列連結で file:// URL を作っている箇所を返す純関数。
 * このファイル自身の説明文が引っかからないよう、呼び出し側で除外する。
 */
function findViolations(source) {
  const found = [];
  const patterns = [
    // `file://${...}` — テンプレートリテラル連結
    { re: /`file:\/\/\$\{/g, kind: "template-literal" },
    // "file://" + x / 'file://' + x
    { re: /["']file:\/\/["']\s*\+/g, kind: "string-concat" },
  ];
  const lines = source.split("\n");
  lines.forEach((line, index) => {
    for (const { re, kind } of patterns) {
      re.lastIndex = 0;
      if (re.test(line)) {
        found.push({ line: index + 1, kind, text: line.trim() });
      }
    }
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
    if (entry.name.startsWith(".") && entry.name !== ".claude") {
      if (![".github"].includes(entry.name)) continue;
    }
    if (SKIP_DIRS.has(entry.name)) continue;
    const absolute = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(absolute, out);
    else if (EXTENSIONS.has(path.extname(entry.name))) out.push(absolute);
  }
  return out;
}

function inspect(root = ROOT) {
  const self = path.resolve(__dirname, "check-file-url-guard.cjs");
  const selfTest = path.resolve(
    __dirname,
    "__tests__",
    "check-file-url-guard.test.cjs",
  );
  const findings = [];
  for (const scanRoot of SCAN_ROOTS) {
    for (const file of walk(path.join(root, scanRoot))) {
      if (file === self || file === selfTest) continue;
      const violations = findViolations(fs.readFileSync(file, "utf8"));
      for (const violation of violations) {
        findings.push({
          file: path.relative(root, file).split(path.sep).join("/"),
          ...violation,
        });
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
    console.log("✓ file:// URL の文字列連結なし");
  } else {
    for (const f of findings) {
      console.error(`✗ ${f.file}:${f.line} [${f.kind}] ${f.text}`);
    }
    console.error(
      `\n${findings.length} 件。file:// URL は文字列連結で作らず pathToFileURL / new URL を使う。` +
        `\nWindows で必ず不一致になり、エントリポイント判定なら main() が呼ばれないまま exit 0 で終わる。`,
    );
  }
  process.exit(findings.length === 0 ? 0 : 1);
}

module.exports = { findViolations, inspect };
