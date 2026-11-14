#!/usr/bin/env node
"use strict";

// 記憶の索引 .claude/memory/MEMORY.md が、Claude Code の起動時に全行読み込まれる大きさに
// 収まっているかを検査する。上限を超えると末尾 (= 新しい記憶) から読み込まれなくなり、
// 起動時の警告でしか気づけない (2026-11-11 に 41.5KB・192 行で末尾 21 行が欠けた)。
// 上限の数値はこのファイルの定数が唯一の置き場。

const fs = require("node:fs");
const path = require("node:path");

// Claude Code が MEMORY.md を読み込む上限 (起動時の警告で確認した約 24.4KB と 200 行)。
const MAX_BYTES = 24_400;
const MAX_LINES = 200;

const ROOT = process.env.STATS47_SCAN_ROOT || path.resolve(__dirname, "..", "..", "..");
const INDEX_PATH = path.join(ROOT, ".claude", "memory", "MEMORY.md");

/** 索引の本文から、上限超過の指摘を返す。バイト数は UTF-8 で数える。 */
function inspect(content) {
  const findings = [];
  const bytes = Buffer.byteLength(content, "utf8");
  const lines = content === "" ? 0 : content.split("\n").length - (content.endsWith("\n") ? 1 : 0);
  if (bytes > MAX_BYTES) {
    findings.push(`${bytes} バイトで上限 ${MAX_BYTES} バイトを ${bytes - MAX_BYTES} バイト超えている`);
  }
  if (lines > MAX_LINES) {
    findings.push(`${lines} 行で上限 ${MAX_LINES} 行を ${lines - MAX_LINES} 行超えている`);
  }
  return findings;
}

function main() {
  let content;
  try {
    content = fs.readFileSync(INDEX_PATH, "utf8");
  } catch (error) {
    console.error(`✗ 記憶の索引を読めない: ${INDEX_PATH} (${error.code ?? error.message})`);
    process.exit(1);
  }
  const findings = inspect(content);
  if (findings.length === 0) {
    console.log(`✓ MEMORY.md は上限以内 (${Buffer.byteLength(content, "utf8")} / ${MAX_BYTES} バイト)`);
    return;
  }
  console.error("✗ .claude/memory/MEMORY.md が起動時の読み込み上限を超えている:");
  for (const finding of findings) console.error(`  - ${finding}`);
  console.error("  超えた分は末尾 (新しい記憶) から読み込まれない。1 行を約 200 字以内に縮めて詳細は各記憶ファイルへ移し、");
  console.error("  重複と成り立たない記憶をまとめるか消す (skill consolidate-memory)。");
  process.exit(1);
}

if (require.main === module) main();

module.exports = { MAX_BYTES, MAX_LINES, inspect };
