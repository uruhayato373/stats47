#!/usr/bin/env node
"use strict";

// GitHub Actions の actions/github-script ステップ内 inline JS で、GitHub API 呼び出し
// (github.rest.*/graphql/paginate/octokit.*) が await されずに「裸の文」として呼ばれるのを弾く。
//
// なぜ要るか (2026-07-20): pr-quality-check.yml のカバレッジコメント投稿が
//   github.rest.issues.createComment({...});   // ← await 忘れ
// で、GitHub API 503 時に reject が try/catch を素通りし unhandled rejection になり、
// テストは全 pass なのに Unit Tests job 全体が fail した。actionlint は YAML/shell は見るが
// github-script の inline JS は lint しないため、この class をすり抜けた。本 guard がそれを塞ぐ。
//
// 判定: API 呼び出しの直前トークンが await / return / 代入(=) / アロー(=>) / .then / .catch の
// いずれでもない「裸の文」を UNAWAITED_GH_CALL として報告する。コメント行 (// または YAML #) は除外。

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const WORKFLOW_DIR = path.join(ROOT, ".github/workflows");

// github.rest.<group>.<method>( / github.graphql( / github.paginate( / octokit(.rest)?.…(
const CALL = /\bgithub\.(?:rest\.[A-Za-z]+\.[A-Za-z]+|graphql|paginate)\s*\(|\boctokit\.[A-Za-z.]+\s*\(/;
// 呼び出しの前に付いていれば「awaitされている / 返している / 代入している」= 安全
const SAFE_BEFORE = /await\s*$|await\s+[^=]*$|return\s|=>\s*$|[=:]\s*$|\.then\s*\(\s*$|\.catch\s*\(\s*$/;

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }

function listWorkflows() {
  if (!fs.existsSync(WORKFLOW_DIR)) return [];
  return fs.readdirSync(WORKFLOW_DIR)
    .filter((name) => /\.ya?ml$/.test(name))
    .map((name) => path.join(WORKFLOW_DIR, name));
}

function inspect(file) {
  const findings = [];
  fs.readFileSync(file, "utf8").split(/\r?\n/).forEach((line, index) => {
    const match = CALL.exec(line);
    if (!match) return;
    const before = line.slice(0, match.index);
    // コメント行は除外 (JS の // / YAML の #。ただし # は行頭側のみ = URL 中の # を誤判定しない)
    if (before.includes("//")) return;
    if (/^\s*#/.test(line)) return;
    // await / return / 代入 / アロー / .then / .catch を伴えば安全
    if (SAFE_BEFORE.test(before)) return;
    findings.push({
      code: "UNAWAITED_GH_CALL",
      file: rel(file),
      line: index + 1,
      content: line.trim().slice(0, 120),
    });
  });
  return findings;
}

function collect() {
  return listWorkflows().flatMap(inspect);
}

function main() {
  const findings = collect();
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings }, null, 2));
  } else if (!findings.length) {
    console.log("✓ github-script: 未await の GitHub API 呼び出しなし");
  } else {
    console.error(`✗ github-script: ${findings.length} 件の未await GitHub API 呼び出し`);
    findings.forEach((f) => console.error(`  [${f.code}] ${f.file}:${f.line} ${f.content}`));
    console.error("  → await を付ける (未await だと 503 等の reject が unhandled rejection になり job が落ちる)");
  }
  process.exitCode = findings.length ? 1 : 0;
}

if (require.main === module) main();
module.exports = { collect };
