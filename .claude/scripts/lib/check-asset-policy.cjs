#!/usr/bin/env node
"use strict";

// 画像・SVG コントラクトの回帰ガード (MC-14)。
//   phase 1: apps/web/public + docs/21・docs/31 の本文画像参照を検査。
//   phase 2: git 管理対象の画像を repo 全体で棚卸しし、デコード/寸法/容量/形式一致/
//            SVG 安全性/SHA-256 重複/MD・HTML・CSS・TS(X) のローカル参照解決を検査。
//            未参照画像は非ブロックの warning。既存 finding は baseline 化し新規のみ block。
//
//   node check-asset-policy.cjs            # broken 検出 (新規で exit 1)
//   node check-asset-policy.cjs --baseline # 既存 baseline を許容し新規のみ exit 1
//   node check-asset-policy.cjs --write-baseline
//   node check-asset-policy.cjs --json
//
// baseline 識別子は "CODE:relpath:message" (絶対パス/mtime/環境依存を含めない)。
// CI checkout に無い ignore 済み画像は git 管理対象外なので走査しない。

const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const { execFileSync } = require("node:child_process");
const sharp = require("sharp");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const BASELINE = process.env.ASSET_POLICY_BASELINE || path.join(ROOT, ".claude/config/asset-policy-baseline.json");
const PUBLIC = path.join(ROOT, "apps/web/public");
// 本文画像参照 (相対解決) を検査する Markdown ルート。
const DOC_ROOTS = [path.join(ROOT, "docs/21_ブログ記事原稿"), path.join(ROOT, "docs/31_note記事原稿")];

const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;
const RASTER_EXT = /\.(?:png|jpe?g|webp|gif|avif)$/i;
const TEXT_EXT = /\.(?:md|mdx|html?|css|scss|tsx?|jsx?|json|ya?ml)$/i;
const REF_TEXT_EXT = /\.(?:md|mdx|html?|css|scss|tsx?|jsx?)$/i;

// sharp が返す format と許容拡張子の対応 (形式↔拡張子一致検査)。
const FORMAT_EXT = {
  jpeg: ["jpg", "jpeg"], png: ["png"], webp: ["webp"], gif: ["gif"], avif: ["avif", "avifs"],
  heif: ["avif", "heic", "heif"], tiff: ["tif", "tiff"], svg: ["svg"],
};
// public 以外で許容する容量上限 (背景素材や動画サムネ等は大きめを許容し baseline で吸収)。
const SIZE_OGP = 600 * 1024;
const SIZE_PUBLIC = 1024 * 1024;
const SIZE_OTHER = 2 * 1024 * 1024;

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function key(f) { return `${f.code}:${f.file}:${f.message}`; }
function add(findings, code, file, message) { findings.push({ code, file: rel(file), message }); }

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    if (entry.name === "node_modules" || entry.name === ".git") return [];
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}

// git 管理対象を列挙 (CI checkout と同一 scope)。git 不在 (テスト fixture 等) は主要ディレクトリを walk。
function trackedFiles() {
  try {
    const out = execFileSync("git", ["-C", ROOT, "ls-files", "-z"], { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 });
    const files = out.split("\0").filter(Boolean);
    if (files.length) return files.map((f) => path.join(ROOT, f));
  } catch { /* fall through */ }
  const dirs = ["apps/web/public", "docs", "packages", "apps/remotion/public", "apps/web/scripts", ".claude"]
    .map((d) => path.join(ROOT, d));
  return dirs.flatMap(walk);
}

function isOgImage(file) { return /\/og-image(?:-minimal|-dashboard)?\.jpg$/.test(file); }

function inspectSvg(file, findings) {
  const source = fs.readFileSync(file, "utf8");
  if (!/<svg\b/i.test(source)) { add(findings, "SVG_MALFORMED", file, "<svg> 要素がない"); return; }
  if (!/\bviewBox\s*=\s*["'][^"']+["']/i.test(source)) add(findings, "SVG_VIEWBOX", file, "viewBox がない");
  if (/<(?:script|foreignObject)\b/i.test(source)) add(findings, "SVG_ACTIVE_CONTENT", file, "active content (script/foreignObject) がある");
  if (/\b(?:href|xlink:href)\s*=\s*["'](?:https?:)?\/\//i.test(source)) add(findings, "SVG_EXTERNAL_URL", file, "外部 URL 参照がある");
}

// 大文字小文字を厳密に一致させたパスか (case-insensitive FS でも case ミスを検出)。
function exactCasePath(file) {
  const relative = path.relative(ROOT, file);
  let current = ROOT;
  for (const part of relative.split(path.sep)) {
    if (!fs.existsSync(current)) return false;
    if (!fs.readdirSync(current).includes(part)) return false;
    current = path.join(current, part);
  }
  return true;
}

// ローカル画像参照を解決先パスへ変換。/ 始まりは public root、それ以外は参照元からの相対。
function resolveRef(file, target) {
  const clean = target.replace(/^<|>$/g, "").split(/[?#]/)[0];
  if (!clean || /^(?:https?:|data:|mailto:)/i.test(clean)) return null;
  if (!IMAGE_EXT.test(clean)) return null;
  if (/\$\{|<%/.test(clean)) return null; // テンプレート補間は解決しない
  const decoded = decodeURIComponent(clean);
  return clean.startsWith("/") ? path.join(PUBLIC, decoded.slice(1)) : path.resolve(path.dirname(file), decoded);
}

// ファイル種別ごとにローカル画像参照を抽出する。
// markdown のフェンスドコードブロック (```/~~~) とインラインコードスパン (`…`) を除去する。
// これらの中の `![alt](path)` は「こう書け」という手順例・命名規則の説明であり、レンダリングされる
// 実埋め込みではない (例: note の screenshot-guide.md)。参照解決の対象から外して誤検出を防ぐ。
function stripMarkdownCode(source) {
  const out = [];
  let fenceChar = null;
  for (const line of source.split("\n")) {
    const m = line.match(/^\s*(`{3,}|~{3,})/);
    if (fenceChar) {
      if (m && m[1][0] === fenceChar) fenceChar = null; // フェンス閉じ
      continue; // フェンス内は破棄
    }
    if (m) { fenceChar = m[1][0]; continue; } // フェンス開始
    out.push(line.replace(/`[^`\n]*`/g, "")); // インラインコードスパンを除去
  }
  return out.join("\n");
}

function extractRefs(file, source) {
  const refs = [];
  const push = (t) => { if (t) refs.push(t); };
  const ext = path.extname(file).toLowerCase();
  if (/\.(?:md|mdx)$/i.test(ext)) {
    const cleaned = stripMarkdownCode(source);
    for (const m of cleaned.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g)) push(m[1]);
    for (const m of cleaned.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) push(m[1]);
  } else if (/\.(?:html?)$/i.test(ext)) {
    for (const m of source.matchAll(/<img\b[^>]*\bsrc\s*=\s*["']([^"']+)["']/gi)) push(m[1]);
    for (const m of source.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi)) push(m[1]);
  } else if (/\.(?:css|scss)$/i.test(ext)) {
    for (const m of source.matchAll(/url\(\s*['"]?([^'")]+?)['"]?\s*\)/gi)) push(m[1]);
  } else if (/\.(?:tsx?|jsx?)$/i.test(ext)) {
    // 補間なしの完全な /public 絶対リテラルのみ (相対 import はバンドラ解決なので除外)。
    for (const m of source.matchAll(/["'`](\/[^"'`${}\s]+\.(?:png|jpe?g|webp|gif|avif|svg))["'`]/gi)) push(m[1]);
  }
  return refs;
}

async function collect() {
  const findings = [];
  const files = trackedFiles();
  const images = files.filter((f) => IMAGE_EXT.test(f) && fs.existsSync(f));
  const textFiles = files.filter((f) => REF_TEXT_EXT.test(f) && fs.existsSync(f));

  // ── 画像本体の検査 (デコード/寸法/容量/形式一致/SVG 安全性/重複) ──
  const hashGroups = new Map();
  let raster = 0, svg = 0;
  for (const file of images) {
    const ext = path.extname(file).toLowerCase().replace(/^\./, "");
    if (ext === "svg") { inspectSvg(file, findings); svg++; continue; }
    raster++;
    const buf = fs.readFileSync(file);
    const hash = crypto.createHash("sha256").update(buf).digest("hex");
    if (!hashGroups.has(hash)) hashGroups.set(hash, []);
    hashGroups.get(hash).push({ path: rel(file), isSymlink: fs.lstatSync(file).isSymbolicLink() });
    try {
      const meta = await sharp(buf).metadata();
      if (!meta.width || !meta.height) add(findings, "INVALID_DIMENSIONS", file, "pixel寸法を取得できない");
      const allowed = FORMAT_EXT[meta.format];
      if (allowed && !allowed.includes(ext)) add(findings, "FORMAT_MISMATCH", file, `format=${meta.format} ext=.${ext}`);
      if (isOgImage(file) && (meta.width !== 1200 || meta.height !== 630))
        add(findings, "OGP_PRESET", file, `expected=1200x630 actual=${meta.width}x${meta.height}`);
    } catch (error) { add(findings, "INVALID_IMAGE", file, String(error.message).split("\n")[0]); }
    const limit = isOgImage(file) ? SIZE_OGP : file.startsWith(PUBLIC + path.sep) ? SIZE_PUBLIC : SIZE_OTHER;
    if (buf.length > limit) add(findings, "OVERSIZED_PUBLIC_ASSET", file, `${buf.length} bytes > ${limit} bytes`);
  }
  // SHA-256 完全同一 (2枚以上) を重複として報告。message にグループ (代表 + 他) を含める。
  // 例外1: docs/31 (note.com 原稿) の記事同梱画像は、note.com が記事ごとに画像実体の
  // アップロードを要求し相対参照 (images/xxx.png) で 1 枚を共有できないため、同一バイトでも
  // 各記事に実体が必要。共有可能な public / docs/21 の重複だけを debt として検出する。
  // 例外2: symlink は実体を持たない参照 (git blob は数十バイトのパス文字列のみ)。
  // AGENTS.md → CLAUDE.md と同じ意図的な単一ソース参照であり、複製ではないため対象外。
  const isNoteEmbeddedAsset = (relPath) => relPath.startsWith("docs/31_note記事原稿/");
  for (const group of hashGroups.values()) {
    if (group.length < 2) continue;
    const sorted = [...group].sort((a, b) => a.path.localeCompare(b.path));
    const canonical = sorted.find((entry) => !entry.isSymlink) ?? sorted[0];
    for (const entry of sorted) {
      if (entry === canonical || entry.isSymlink) continue;
      const dup = entry.path;
      if (isNoteEmbeddedAsset(dup)) continue;
      findings.push({ code: "DUPLICATE_IMAGE", file: dup, message: `same bytes as ${canonical.path}` });
    }
  }

  // ── ローカル画像参照の解決検査 (MD/HTML/CSS/TS(X)) ──
  let checkedText = 0;
  const referencedBasenames = new Set();
  for (const file of textFiles) {
    const inDocRoot = DOC_ROOTS.some((r) => file.startsWith(r + path.sep));
    const scanRefsForMissing = inDocRoot || /\.(?:css|scss|html?)$/i.test(file) || file.startsWith(PUBLIC + path.sep);
    let source;
    try { source = fs.readFileSync(file, "utf8"); } catch { continue; }
    checkedText++;
    for (const target of extractRefs(file, source)) {
      const base = path.basename(target.split(/[?#]/)[0]);
      if (IMAGE_EXT.test(base)) referencedBasenames.add(base);
      if (!scanRefsForMissing) continue; // TS(X) は参照集計のみ (誤検出防止), 欠落 block はしない
      const resolved = resolveRef(file, target);
      if (!resolved) continue;
      if (!fs.existsSync(resolved)) add(findings, "MISSING_REFERENCE", file, target);
      else if (!exactCasePath(resolved)) add(findings, "CASE_MISMATCH", file, target);
    }
  }

  // ── 未参照画像 (report only・block しない) ──
  const warnings = [];
  for (const file of images) {
    if (file.startsWith(PUBLIC + path.sep)) continue; // public は URL/manifest 経由参照が多く判定不能なので除外
    if (!referencedBasenames.has(path.basename(file))) warnings.push({ code: "UNREFERENCED_IMAGE", file: rel(file), message: "どのテキストからも参照されていない可能性" });
  }

  return { checkedImages: images.length, checkedRaster: raster, checkedSvg: svg, checkedText, findings, warnings };
}

async function main() {
  const result = await collect();
  if (process.argv.includes("--write-baseline")) {
    fs.mkdirSync(path.dirname(BASELINE), { recursive: true });
    fs.writeFileSync(BASELINE, `${JSON.stringify({ version: 1, findings: result.findings.map(key).sort() }, null, 2)}\n`);
    console.log(`✓ asset policy baseline 更新: ${rel(BASELINE)} (${result.findings.length} findings)`);
    return;
  }
  const known = process.argv.includes("--baseline") && fs.existsSync(BASELINE)
    ? new Set(JSON.parse(fs.readFileSync(BASELINE, "utf8")).findings || []) : new Set();
  const fresh = result.findings.filter((finding) => !known.has(key(finding)));
  if (process.argv.includes("--json")) { console.log(JSON.stringify({ ...result, newFindings: fresh }, null, 2)); process.exitCode = fresh.length ? 1 : 0; return; }
  if (!fresh.length) {
    console.log(`✓ asset policy 悪化なし — ${result.checkedImages} images (raster ${result.checkedRaster} / svg ${result.checkedSvg}) / text ${result.checkedText} / known ${result.findings.length} / unreferenced(warn) ${result.warnings.length}`);
  } else {
    console.error(`✗ asset policy: ${fresh.length} new findings`);
    for (const finding of fresh) console.error(`  [${finding.code}] ${finding.file}: ${finding.message}`);
  }
  process.exitCode = fresh.length ? 1 : 0;
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { collect };
