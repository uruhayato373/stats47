#!/usr/bin/env node
/**
 * docs リンク整合チェッカー (整理・削除の安全ガードレール)
 *
 * 目的: docs/ の整理・archive・削除・移動で、.claude/(agent/skill/rule) や CLAUDE.md、
 *       docs 相互から参照される `docs/....md` パスを黙って壊さないようにする。
 *
 * 使い方:
 *   node .claude/scripts/lib/check-docs-links.cjs            # broken 参照検出 (壊れていれば exit 1)
 *   node .claude/scripts/lib/check-docs-links.cjs --orphans  # どこからも参照されない docs を列挙 (advisory, exit 0)
 *   node .claude/scripts/lib/check-docs-links.cjs --json     # 機械可読出力
 *
 * 検出対象: ルート相対 `docs/<...>.md` 参照 (agent が読む主要な参照形式)。
 *           日本語ディレクトリ名 (01_技術設計 等) に対応。#anchor は除いてファイル存在を見る。
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const has = (f) => args.includes(f);

// 参照を集める走査対象 (これらの中の `docs/...md` 言及を検証する)。
const SCAN_ROOTS = [".claude", "docs"];
const SCAN_FILES = ["CLAUDE.md"]; // ルート直下の単体ファイル
const SCAN_EXTS = [".md", ".mdc", ".yml", ".yaml", ".json", ".cjs", ".mjs", ".js", ".ts"];

// `docs/<path>.md` を抽出。非貪欲で最初の .md まで、直後に \b (拡張子の部分列誤マッチ防止)。
// 区切り文字 (空白・括弧・引用符・句読点・バックティック等) は path に含めない。
const DOCS_REF_RE = /docs\/[^\s)\]}"'`<>|,;：、。（）「」]+?\.md\b/g;

function walk(dir, out = []) {
  let entries;
  try {
    entries = fs.readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const e of entries) {
    const p = path.join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name === "node_modules" || e.name === ".git" || e.name === ".next") continue;
      walk(p, out);
    } else {
      out.push(p);
    }
  }
  return out;
}
const rel = (p) => path.relative(ROOT, p).split(path.sep).join("/");
function readSafe(p) {
  try {
    return fs.readFileSync(p, "utf8");
  } catch {
    return "";
  }
}

// ── 走査対象ファイルを集める ──────────────────────────────────
const scanFiles = [];
for (const r of SCAN_ROOTS) {
  for (const f of walk(path.join(ROOT, r))) {
    if (SCAN_EXTS.some((x) => f.endsWith(x))) scanFiles.push(f);
  }
}
for (const f of SCAN_FILES) {
  const p = path.join(ROOT, f);
  if (fs.existsSync(p)) scanFiles.push(p);
}

// ── 参照抽出 (referrer → [referenced docs path]) ──────────────
/** referenced docs path (正規化) → Set(referrer rel path) */
const refMap = new Map();
// プレースホルダ/glob/テンプレ変数を含む「参照」は実パスでないので除外する。
const isPlaceholder = (p) =>
  p.includes("...") ||
  p.includes("*") ||
  p.includes("<") ||
  p.includes(">") ||
  p.includes("{") ||
  p.includes("YYYY") ||
  p.includes("NNN");
// 自己 (このチェッカーの regex 例) は走査対象から外す。
const SELF = rel(__filename);
for (const f of scanFiles) {
  if (rel(f) === SELF) continue;
  const text = readSafe(f);
  const matches = text.match(DOCS_REF_RE);
  if (!matches) continue;
  const referrer = rel(f);
  for (const m of matches) {
    if (isPlaceholder(m)) continue;
    if (!refMap.has(m)) refMap.set(m, new Set());
    refMap.get(m).add(referrer);
  }
}

// ── broken 参照検出 ───────────────────────────────────────────
const broken = [];
for (const [ref, referrers] of refMap) {
  const abs = path.join(ROOT, ref);
  if (!fs.existsSync(abs)) {
    broken.push({ ref, referrers: [...referrers].sort() });
  }
}
broken.sort((a, b) => a.ref.localeCompare(b.ref));

// ── orphan 列挙 (--orphans) ───────────────────────────────────
function listOrphans() {
  const allDocs = walk(path.join(ROOT, "docs"))
    .filter((f) => f.endsWith(".md"))
    .map(rel);
  const referenced = new Set([...refMap.keys()]);
  // 自分自身への言及 (docs 内の相対言及がルート相対で書かれている等) も referenced 扱い。
  const orphans = allDocs.filter((d) => !referenced.has(d));
  // トップディレクトリ別に集計。
  const byDir = new Map();
  for (const o of orphans) {
    const seg = o.split("/").slice(0, 2).join("/"); // docs/<topdir>
    if (!byDir.has(seg)) byDir.set(seg, []);
    byDir.get(seg).push(o);
  }
  return { orphans, byDir, total: allDocs.length };
}

// ── 出力 ──────────────────────────────────────────────────────
if (has("--json")) {
  const out = { broken, refCount: refMap.size, scanned: scanFiles.length };
  if (has("--orphans")) {
    const { orphans, total } = listOrphans();
    out.orphans = orphans;
    out.docTotal = total;
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit(broken.length > 0 ? 1 : 0);
}

if (has("--orphans")) {
  const { byDir, orphans, total } = listOrphans();
  console.log(`\n=== 参照されない docs (${orphans.length}/${total} 件・整理候補。content 系は設計上 orphan) ===`);
  const dirs = [...byDir.entries()].sort((a, b) => b[1].length - a[1].length);
  for (const [dir, files] of dirs) {
    console.log(`  ${dir}/  — ${files.length} 件`);
  }
  console.log(`\n(個別一覧は --json で。参照されている docs は整理時に参照更新が必須)`);
}

if (broken.length === 0) {
  console.log(`✓ docs リンク整合 OK — ${refMap.size} 参照 / ${scanFiles.length} ファイル走査、broken 0`);
  process.exit(0);
}

console.error(`✗ docs リンク broken: ${broken.length} 件`);
for (const b of broken) {
  console.error(`\n  [MISSING] ${b.ref}`);
  for (const r of b.referrers) console.error(`     ← ${r}`);
}
console.error(`\n整理で docs を移動/削除したら、上記 referrer の参照を更新するか、パスを戻すこと。`);
process.exit(1);
