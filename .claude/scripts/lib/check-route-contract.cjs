#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const APP_ROOT = path.join(ROOT, "apps/web/src/app");
const args = process.argv.slice(2);
const has = (value) => args.includes(value);
const writeIndex = args.indexOf("--write-baseline");
const baselineArg = writeIndex === -1 ? null : args[writeIndex + 1];
const BASELINE_PATH = path.resolve(
  ROOT,
  baselineArg && !baselineArg.startsWith("--")
    ? baselineArg
    : (process.env.ROUTE_CONTRACT_BASELINE ?? ".claude/config/route-contract-baseline.json"),
);

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(directory, output = []) {
  let entries = [];
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return output; }
  for (const entry of entries) {
    if (["__tests__", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (entry.name === "page.tsx" || entry.name === "page.ts") output.push(absolute);
  }
  return output;
}

function routeFromPage(file) {
  const directory = path.relative(APP_ROOT, path.dirname(file)).split(path.sep);
  const segments = directory.filter((segment) => segment && !/^\(.+\)$/.test(segment));
  return `/${segments.join("/")}`.replace(/\/$/, "") || "/";
}

function isStaticRoute(route) { return !route.split("/").some((segment) => /^\[.+\]$/.test(segment)); }
function finding(code, file, route, message) { return { code, file: rel(file), route, message }; }

function inspect() {
  const pages = walk(APP_ROOT).sort();
  const findings = [];
  const routes = new Map();
  const sitemapFiles = [path.join(APP_ROOT, "sitemap.ts"), path.join(APP_ROOT, "sitemap.xml/route.ts")];
  const sitemapText = sitemapFiles.filter(fs.existsSync).map((file) => fs.readFileSync(file, "utf8")).join("\n");

  for (const file of pages) {
    const source = fs.readFileSync(file, "utf8");
    const route = routeFromPage(file);
    if (!routes.has(route)) routes.set(route, []);
    routes.get(route).push(file);

    const hasMetadata = /export\s+(?:const\s+metadata|(?:async\s+)?function\s+generateMetadata)\b/.test(source);
    if (!hasMetadata) findings.push(finding("PAGE_METADATA_MISSING", file, route, "page has no metadata or generateMetadata export"));

    const canonicals = [...source.matchAll(/canonical\s*:\s*["']([^"']+)["']/g)].map((match) => match[1]);
    for (const canonical of canonicals) {
      if (!canonical.startsWith("/") || (canonical.length > 1 && canonical.endsWith("/"))) {
        findings.push(finding("CANONICAL_INVALID", file, route, `canonical=${canonical}`));
      } else if (isStaticRoute(route) && canonical !== route) {
        findings.push(finding("CANONICAL_MISMATCH", file, route, `canonical=${canonical}`));
      }
    }

    const isNoIndex = /robots\s*:\s*(?:["'][^"']*noindex|\{[\s\S]{0,300}?index\s*:\s*false)/.test(source);
    if (isNoIndex && isStaticRoute(route)) {
      const escaped = route.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      if (new RegExp(`["']${escaped}["']`).test(sitemapText)) {
        findings.push(finding("NOINDEX_SITEMAP_CONFLICT", file, route, "literal noindex route is present in sitemap source"));
      }
    }
  }
  for (const [route, files] of routes) {
    if (files.length > 1) {
      findings.push(finding("DUPLICATE_ROUTE", files[0], route, files.map(rel).join(", ")));
    }
  }
  findings.sort((a, b) => `${a.code}\0${a.file}\0${a.route}`.localeCompare(`${b.code}\0${b.file}\0${b.route}`));
  return { pages: pages.length, findings };
}

function key(item) { return `${item.code}\u0000${item.file}\u0000${item.route}`; }
function writeBaseline(result) {
  const output = { version: 1, description: "Known route contract findings. New code/file/route tuples fail --baseline.", findings: result.findings };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✓ route contract baseline 更新: ${rel(BASELINE_PATH)} (${result.findings.length})`);
}
function readBaseline() {
  try {
    const value = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    if (value.version !== 1 || !Array.isArray(value.findings)) throw new Error("invalid schema");
    return value;
  } catch (error) {
    console.error(`✗ route contract baseline を読めない: ${String(error)}`);
    process.exit(2);
  }
}

const result = inspect();
if (writeIndex !== -1) { writeBaseline(result); process.exit(0); }
let regressions = result.findings;
let resolved = [];
if (has("--baseline")) {
  const baseline = readBaseline();
  const known = new Set(baseline.findings.map(key));
  const current = new Set(result.findings.map(key));
  regressions = result.findings.filter((item) => !known.has(key(item)));
  resolved = baseline.findings.filter((item) => !current.has(key(item)));
}
const output = { pages: result.pages, findings: result.findings, regressions, resolved };
if (has("--json")) console.log(JSON.stringify(output, null, 2));
else if (regressions.length === 0) console.log(`✓ route contract 悪化なし — ${result.pages} pages / known ${result.findings.length} / new 0`);
else {
  console.error(`✗ route contract 新規違反: ${regressions.length}`);
  for (const item of regressions) console.error(`  [${item.code}] ${item.file} (${item.route}): ${item.message}`);
}
process.exit(regressions.length === 0 ? 0 : 1);
