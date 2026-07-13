#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const sharp = require("sharp");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const BASELINE = process.env.ASSET_POLICY_BASELINE || path.join(ROOT, ".claude/config/asset-policy-baseline.json");
const PUBLIC = path.join(ROOT, "apps/web/public");
const DOC_ROOTS = [path.join(ROOT, "docs/21_ブログ記事原稿"), path.join(ROOT, "docs/31_note記事原稿")];
const IMAGE_EXT = /\.(?:png|jpe?g|webp|gif|avif|svg)$/i;
const RASTER_EXT = /\.(?:png|jpe?g|webp|gif|avif)$/i;

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function key(f) { return `${f.code}:${f.file}:${f.message}`; }
function add(findings, code, file, message) { findings.push({ code, file: rel(file), message }); }

function inspectSvg(file, findings) {
  const source = fs.readFileSync(file, "utf8");
  if (!/<svg\b/i.test(source) || !/\bviewBox\s*=\s*["'][^"']+["']/i.test(source))
    add(findings, "SVG_VIEWBOX", file, "viewBox がない");
  if (/<(?:script|foreignObject)\b/i.test(source)) add(findings, "SVG_ACTIVE_CONTENT", file, "active content がある");
  if (/\b(?:href|xlink:href)\s*=\s*["'](?:https?:)?\/\//i.test(source)) add(findings, "SVG_EXTERNAL_URL", file, "外部 URL 参照がある");
}

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

function inspectMarkdown(file, findings) {
  const source = fs.readFileSync(file, "utf8");
  const matches = source.matchAll(/!\[[^\]]*\]\(([^)\s]+)(?:\s+["'][^"']*["'])?\)/g);
  for (const match of matches) {
    const target = match[1].replace(/^<|>$/g, "").split(/[?#]/)[0];
    if (!target || /^(?:https?:|data:)/i.test(target) || !IMAGE_EXT.test(target)) continue;
    const resolved = path.resolve(path.dirname(file), decodeURIComponent(target));
    if (!fs.existsSync(resolved)) add(findings, "MISSING_REFERENCE", file, target);
    else if (!exactCasePath(resolved)) add(findings, "CASE_MISMATCH", file, target);
  }
}

async function collect() {
  const findings = [];
  const assets = walk(PUBLIC).filter((file) => IMAGE_EXT.test(file));
  for (const file of assets) {
    const ext = path.extname(file).toLowerCase();
    if (ext === ".svg") inspectSvg(file, findings);
    else if (RASTER_EXT.test(file)) {
      try {
        const metadata = await sharp(file).metadata();
        if (!metadata.width || !metadata.height) add(findings, "INVALID_DIMENSIONS", file, "pixel寸法を取得できない");
        if (/\/og-image(?:-minimal)?\.jpg$/.test(file) && (metadata.width !== 1200 || metadata.height !== 630))
          add(findings, "OGP_PRESET", file, `expected=1200x630 actual=${metadata.width}x${metadata.height}`);
      } catch (error) { add(findings, "INVALID_IMAGE", file, error.message.split("\n")[0]); }
    }
    const limit = /\/og-image(?:-minimal)?\.jpg$/.test(file) ? 600 * 1024 : 1024 * 1024;
    const bytes = fs.statSync(file).size;
    if (bytes > limit) add(findings, "OVERSIZED_PUBLIC_ASSET", file, `${bytes} bytes > ${limit} bytes`);
  }
  for (const root of DOC_ROOTS) for (const file of walk(root).filter((f) => /\.md$/i.test(f))) inspectMarkdown(file, findings);
  return { checkedAssets: assets.length, checkedMarkdown: DOC_ROOTS.flatMap(walk).filter((f) => /\.md$/i.test(f)).length, findings };
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
  if (process.argv.includes("--json")) console.log(JSON.stringify({ ...result, newFindings: fresh }, null, 2));
  else if (!fresh.length) console.log(`✓ asset policy 悪化なし — ${result.checkedAssets} assets / ${result.checkedMarkdown} markdown / known ${result.findings.length}`);
  else {
    console.error(`✗ asset policy: ${fresh.length} new findings`);
    for (const finding of fresh) console.error(`  [${finding.code}] ${finding.file}: ${finding.message}`);
  }
  process.exitCode = fresh.length ? 1 : 0;
}

if (require.main === module) main().catch((error) => { console.error(error); process.exitCode = 1; });
module.exports = { collect };
