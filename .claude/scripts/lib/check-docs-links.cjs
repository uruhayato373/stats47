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
 *   node .claude/scripts/lib/check-docs-links.cjs --baseline # 既存 broken を許容し、新規悪化のみ exit 1
 *   node .claude/scripts/lib/check-docs-links.cjs --write-baseline [path]
 *                                                          # 現在値を baseline JSON に書く
 *
 * 検出対象: ルート相対 `docs/<...>.md` 参照 (agent が読む主要な参照形式)。
 *           日本語ディレクトリ名 (01_技術設計 等) に対応。#anchor は除いてファイル存在を見る。
 */

const fs = require("fs");
const path = require("path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const has = (f) => args.includes(f);
const writeBaselineIndex = args.indexOf("--write-baseline");
const baselineArg = writeBaselineIndex === -1 ? null : args[writeBaselineIndex + 1];
const BASELINE_PATH = path.resolve(
  ROOT,
  baselineArg && !baselineArg.startsWith("--")
    ? baselineArg
    : (process.env.DOCS_LINKS_BASELINE ?? ".claude/config/docs-links-baseline.json"),
);

// 参照を集める走査対象 (これらの中の `docs/...md` 言及を検証する)。
//
// `.github` / `apps` / `packages` を含めるのは、workflow のコメントとコードの docstring も
// 「agent と人間が正典を辿る入口」だからである。2026-07-30 の docs 再編でここを走査して
// いなかったため、削除済み doc への参照が 7 箇所 (workflow 5・packages/types 2) 素通りした。
// walk が node_modules / .git / .next / .claude/worktrees を除外するので追加コストは小さい。
const SCAN_ROOTS = [".claude", "docs", ".github", "apps", "packages"];
const SCAN_FILES = ["CLAUDE.md"]; // ルート直下の単体ファイル
const SCAN_EXTS = [".md", ".mdc", ".yml", ".yaml", ".json", ".cjs", ".mjs", ".js", ".ts"];
// 完了時点の gate コマンドを保存する履歴。公開後に一時 outbox が消えるのは正常なので、
// 現行ドキュメントへの導線としては扱わない。
const HISTORICAL_EVIDENCE_FILES = new Set([".claude/state/backlog-loop/ledger.json"]);

// `docs/<path>.md` を抽出。非貪欲で最初の .md まで、直後に \b (拡張子の部分列誤マッチ防止)。
// 区切り文字 (空白・括弧・引用符・句読点・バックティック等) は path に含めない。
const DOCS_REF_RE = /docs\/[^\s)\]}"'`<>|,;：、。（）「」]+?\.md\b/g;
// `maintain-docs/SKILL.md` のように別path segmentの末尾が "docs" の場合は
// ルート相対docs参照ではない。直前が識別子/path名文字なら除外する。
const isEmbeddedDocsSegment = (text, index) =>
  index > 0 && /[A-Za-z0-9_.-]/.test(text[index - 1]);

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
      // 別 checkout は現在の working tree と独立した履歴を持つため、リンク検査へ混ぜない。
      // 混ぜると docs 整理のたびに古い worktree 内の参照が「新規 broken」扱いになる。
      if (rel(p) === ".claude/worktrees") continue;
      walk(p, out);
    } else {
      // ガードの baseline ファイル群は「finding 行内容の引用」であってリンク参照元ではない
      // (maintenance-debt baseline v2 が行内容に旧 docs パス文字列を含み誤検知 — 2026-07-14)
      if (/-baseline\.json$/.test(e.name)) continue;
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
  p.includes("NNN") ||
  // workflow の `docs/21_ブログ記事原稿/$SLUG/article.md` のようなシェル変数展開は
  // 実パスではない。走査範囲を .github へ広げた 2026-07-30 に誤検知 3 件が出たため追加。
  p.includes("$");
// 自己 (このチェッカーの regex 例) は走査対象から外す。
const SELF = rel(__filename);
const BASELINE_REL = rel(BASELINE_PATH);
for (const f of scanFiles) {
  const relativePath = rel(f);
  if (
    relativePath === SELF ||
    relativePath === BASELINE_REL ||
    HISTORICAL_EVIDENCE_FILES.has(relativePath) ||
    relativePath.split("/").includes("__tests__")
  ) {
    continue;
  }
  const text = readSafe(f);
  const matches = [...text.matchAll(DOCS_REF_RE)];
  if (matches.length === 0) continue;
  const referrer = rel(f);
  for (const match of matches) {
    if (isEmbeddedDocsSegment(text, match.index)) continue;
    const m = match[0];
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

// baseline は missing path だけでなく referrer 単位で持つ。
// 既存 missing path へ別ファイルから新規参照を追加した悪化も検出するため。
function flattenBroken(items) {
  return items.flatMap((item) =>
    item.referrers.map((referrer) => ({ ref: item.ref, referrer })),
  );
}

function findingKey(item) {
  return `${item.ref}\u0000${item.referrer}`;
}

function readBaseline() {
  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
  } catch (error) {
    console.error(`✗ docs link baseline を読めない: ${rel(BASELINE_PATH)} (${String(error)})`);
    process.exit(2);
  }
  if (!parsed || parsed.version !== 1 || !Array.isArray(parsed.findings)) {
    console.error(`✗ docs link baseline 形式が不正: ${rel(BASELINE_PATH)}`);
    process.exit(2);
  }
  return parsed;
}

function writeBaseline() {
  const findings = flattenBroken(broken).sort((a, b) =>
    findingKey(a).localeCompare(findingKey(b)),
  );
  const output = {
    version: 1,
    description: "Known broken docs references. New ref/referrer pairs fail --baseline.",
    findings,
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(`✓ docs link baseline 更新: ${rel(BASELINE_PATH)} (${findings.length} findings)`);
}

if (writeBaselineIndex !== -1) {
  writeBaseline();
  process.exit(0);
}

let regressions = [];
let resolved = [];
if (has("--baseline")) {
  const baseline = readBaseline();
  const current = flattenBroken(broken);
  const baselineKeys = new Set(baseline.findings.map(findingKey));
  const currentKeys = new Set(current.map(findingKey));
  regressions = current.filter((item) => !baselineKeys.has(findingKey(item)));
  resolved = baseline.findings.filter((item) => !currentKeys.has(findingKey(item)));
}

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
  const out = {
    broken,
    regressions,
    resolved,
    baseline: has("--baseline") ? rel(BASELINE_PATH) : null,
    refCount: refMap.size,
    scanned: scanFiles.length,
  };
  if (has("--orphans")) {
    const { orphans, total } = listOrphans();
    out.orphans = orphans;
    out.docTotal = total;
  }
  console.log(JSON.stringify(out, null, 2));
  process.exit((has("--baseline") ? regressions.length : broken.length) > 0 ? 1 : 0);
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

if (has("--baseline")) {
  if (regressions.length === 0) {
    console.log(
      `✓ docs リンク悪化なし — known ${flattenBroken(broken).length} / resolved ${resolved.length} / new 0`,
    );
    process.exit(0);
  }
  console.error(`✗ docs リンクの新規 broken: ${regressions.length} 件`);
  for (const item of regressions) {
    console.error(`  [NEW] ${item.ref} ← ${item.referrer}`);
  }
  console.error(`\nbaseline: ${rel(BASELINE_PATH)}`);
  process.exit(1);
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
