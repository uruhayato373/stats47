#!/usr/bin/env node
/**
 * docs → コード参照の実在チェッカー
 *
 * 目的: 設計書・実装仕様・戦略文書が、削除・改名済みのスクリプト / スキル / npm script を
 *       現行の手順として案内し続けるのを止める。agent は CLAUDE.md から docs を必読として辿るので、
 *       rules を直しても docs 側の古い案内から廃止した手順へ逆戻りする (2026-09-25 の docs 監査で、
 *       SNS 設計書が存在しない `/post-x-6angles` を「主力」と案内していた)。
 *
 * 逆向き (コード → docs/*.md) は check-docs-links.cjs が見る。こちらは docs → コードだけを見る。
 *
 * 検査する参照 (docs/**\/*.md の各行):
 *   1. リポジトリ内パス  `.claude/` `.github/` `apps/` `packages/` `scripts/` で始まるもの → 実在
 *   2. `npm run <name>`  → root か workspace (apps/*, packages/*) の package.json scripts に実在
 *   3. バッククォート内の `/<name>` → スキル (.claude/skills/**\/<name>/SKILL.md) か
 *      サイト / 管理画面のトップレベル route か Claude Code の組み込みコマンド
 *
 * 許容: 行に「計画・将来・予定・新規・未実装・廃止・旧・退役・削除済・していた・vault・Obsidian」の
 *       どれかがあれば、未作成の予定や過去の経緯・リポジトリ外の説明として検査しない。
 * 除外: docs/31_note記事原稿/ (読者の環境を例示するパスを含む記事原稿で、stats47 の手順ではない)。
 *
 * 使い方:
 *   node .claude/scripts/lib/check-docs-code-refs.cjs         # 壊れた参照があれば exit 1
 *   node .claude/scripts/lib/check-docs-code-refs.cjs --json
 */

const fs = require("fs");
const path = require("path");

const EXCLUDED_DIRS = ["docs/31_note記事原稿"];
const ALLOW_MARKER_RE = /計画|将来|予定|新規|未実装|廃止|旧|退役|削除済|していた|vault|Obsidian/;
const PATH_RE = /(?<![\w./-])((?:\.claude|\.github|apps|packages|scripts)\/[^\s`'"()[\]|,;：、。（）「」・*]+)/g;
const NPM_RE = /npm run ([\w:.-]+)/g;
const SLASH_RE = /`\/([a-z][a-z0-9-]*)(?=[`\s])/g;
const BUILTIN_COMMANDS = new Set([
  "mcp", "compact", "clear", "model", "config", "permissions", "hooks", "doctor", "help",
  "init", "memory", "review", "agents", "resume", "login", "logout", "status", "cost",
]);

const toPosix = (p) => p.split(path.sep).join("/");

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    if (e.name === "node_modules" || e.name === ".git" || e.name === ".next") continue;
    const p = path.join(dir, e.name);
    if (e.isDirectory()) walk(p, out);
    else out.push(p);
  }
  return out;
}

function readScripts(pkgPath) {
  try {
    return Object.keys(JSON.parse(fs.readFileSync(pkgPath, "utf8")).scripts || {});
  } catch {
    return [];
  }
}

function listDirs(dir) {
  try {
    return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/** route group `(site)` は URL に現れないので 1 段潜る */
function topLevelRoutes(appDir) {
  const names = new Set();
  for (const name of listDirs(appDir)) {
    if (name.startsWith("(")) listDirs(path.join(appDir, name)).forEach((n) => names.add(n));
    else names.add(name);
  }
  return names;
}

function buildIndex(root) {
  const npmScripts = new Set(readScripts(path.join(root, "package.json")));
  for (const ws of ["apps", "packages"]) {
    for (const name of listDirs(path.join(root, ws))) {
      readScripts(path.join(root, ws, name, "package.json")).forEach((s) => npmScripts.add(s));
    }
  }
  const slashNames = new Set(BUILTIN_COMMANDS);
  for (const f of walk(path.join(root, ".claude/skills"))) {
    if (path.basename(f) === "SKILL.md") slashNames.add(path.basename(path.dirname(f)));
  }
  topLevelRoutes(path.join(root, "apps/web/src/app")).forEach((n) => slashNames.add(n));
  topLevelRoutes(path.join(root, "apps/admin/app")).forEach((n) => slashNames.add(n));
  return { npmScripts, slashNames };
}

const isPlaceholder = (p) => /[{}<>*$]|\.\.\.|YYYY|NNN/.test(p);

function checkLine(line, root, index) {
  if (ALLOW_MARKER_RE.test(line)) return [];
  const found = [];
  for (const m of line.matchAll(PATH_RE)) {
    const ref = m[1].replace(/#.*$/, "").replace(/:\d+(-\d+)?$/, "").replace(/[.:]+$/, "");
    if (isPlaceholder(ref)) continue;
    if (!fs.existsSync(path.join(root, ref))) found.push({ kind: "path", ref });
  }
  for (const m of line.matchAll(NPM_RE)) {
    if (!index.npmScripts.has(m[1])) found.push({ kind: "npm", ref: `npm run ${m[1]}` });
  }
  for (const m of line.matchAll(SLASH_RE)) {
    if (!index.slashNames.has(m[1])) found.push({ kind: "slash", ref: `/${m[1]}` });
  }
  return found;
}

function findStaleRefs(root) {
  const index = buildIndex(root);
  const findings = [];
  const files = walk(path.join(root, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map((f) => toPosix(path.relative(root, f)))
    .filter((f) => !EXCLUDED_DIRS.some((d) => f.startsWith(`${d}/`)))
    .sort();
  for (const file of files) {
    const lines = fs.readFileSync(path.join(root, file), "utf8").split("\n");
    lines.forEach((line, i) => {
      for (const hit of checkLine(line, root, index)) findings.push({ file, line: i + 1, ...hit });
    });
  }
  return findings;
}

module.exports = { findStaleRefs, checkLine, buildIndex };

if (require.main === module) {
  const root = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
  const findings = findStaleRefs(root);
  if (process.argv.includes("--json")) {
    console.log(JSON.stringify({ findings }, null, 2));
  } else if (findings.length === 0) {
    console.log("✓ docs → コード参照 OK — 削除・改名済みのパス / npm script / スキルへの参照なし");
  } else {
    console.error(`✗ docs が存在しないコードを参照: ${findings.length} 件`);
    for (const f of findings) console.error(`  ${f.file}:${f.line} [${f.kind}] ${f.ref}`);
    console.error("\n参照先を現行のものへ直すか、予定・経緯なら行に「計画」「旧」などを明記する。");
  }
  process.exit(findings.length > 0 ? 1 : 0);
}
