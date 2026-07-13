#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const ts = require("typescript");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const SOURCE_ROOT = path.join(ROOT, "apps/web/src");
const args = process.argv.slice(2);
const has = (value) => args.includes(value);
const writeIndex = args.indexOf("--write-baseline");
const baselineArg = writeIndex === -1 ? null : args[writeIndex + 1];
const BASELINE_PATH = path.resolve(
  ROOT,
  baselineArg && !baselineArg.startsWith("--")
    ? baselineArg
    : (process.env.ACCESSIBILITY_BASELINE ?? ".claude/config/accessibility-baseline.json"),
);

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(directory, output = []) {
  let entries = [];
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return output; }
  for (const entry of entries) {
    if (["__tests__", "__mocks__", "node_modules"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (/\.tsx$/.test(entry.name) && !/\.(?:test|spec|stories)\.tsx$/.test(entry.name)) output.push(absolute);
  }
  return output;
}

function tagName(node) {
  const name = node.tagName;
  if (ts.isIdentifier(name)) return name.text;
  if (ts.isPropertyAccessExpression(name)) return name.name.text;
  return name.getText();
}
function attributes(jsxAttributes) {
  const map = new Map();
  let hasSpread = false;
  for (const property of jsxAttributes.properties) {
    if (ts.isJsxSpreadAttribute(property)) { hasSpread = true; continue; }
    map.set(property.name.getText(), property);
  }
  return { map, hasSpread };
}
function literalValue(attribute) {
  if (!attribute?.initializer) return "";
  if (ts.isStringLiteral(attribute.initializer)) return attribute.initializer.text;
  const expression = attribute.initializer.expression;
  return expression && ts.isStringLiteralLike(expression) ? expression.text : null;
}
function location(source, node) {
  const point = source.getLineAndCharacterOfPosition(node.getStart(source));
  return { line: point.line + 1, column: point.character + 1 };
}
function finding(code, file, source, node, message) {
  const at = location(source, node);
  return { code, file: rel(file), line: at.line, column: at.column, message };
}

function inspectFile(file) {
  const text = fs.readFileSync(file, "utf8");
  const source = ts.createSourceFile(file, text, ts.ScriptTarget.Latest, true, ts.ScriptKind.TSX);
  const findings = [];
  function visit(node) {
    if (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) {
      const tag = tagName(node);
      const { map, hasSpread } = attributes(node.attributes);
      const lower = tag.toLowerCase();

      if ((lower === "img" || tag === "Image") && !map.has("alt") && !hasSpread) {
        findings.push(finding("IMAGE_ALT_MISSING", file, source, node, `<${tag}> has no alt`));
      }
      if (map.has("target") && literalValue(map.get("target")) === "_blank") {
        const relValue = literalValue(map.get("rel"));
        if (!relValue || !relValue.split(/\s+/).includes("noopener") || !relValue.split(/\s+/).includes("noreferrer")) {
          findings.push(finding("BLANK_REL_MISSING", file, source, node, 'target="_blank" requires rel="noopener noreferrer"'));
        }
      }
      if (["div", "span", "p", "li"].includes(lower) && map.has("onClick") && !hasSpread) {
        const hasKeyboard = map.has("onKeyDown") || map.has("onKeyUp") || map.has("onKeyPress");
        const hasSemantics = map.has("role") && map.has("tabIndex");
        if (!hasKeyboard || !hasSemantics) {
          findings.push(finding("CLICK_ONLY_NONINTERACTIVE", file, source, node, `<${tag}> onClick requires keyboard handler, role, and tabIndex`));
        }
      }
      if (tag === lower && ["input", "select", "textarea"].includes(lower) && !hasSpread) {
        const identified = map.has("id") || map.has("aria-label") || map.has("aria-labelledby") || map.has("title");
        if (!identified) findings.push(finding("FORM_NAME_MISSING", file, source, node, `<${tag}> has no id or accessible name`));
      }
    }
    ts.forEachChild(node, visit);
  }
  visit(source);
  return findings;
}

function inspect() {
  const files = walk(SOURCE_ROOT).sort();
  const findings = files.flatMap(inspectFile).sort((a, b) => `${a.code}\0${a.file}\0${a.line}`.localeCompare(`${b.code}\0${b.file}\0${b.line}`));
  return { files: files.length, findings };
}
function key(item) { return `${item.code}\u0000${item.file}\u0000${item.line}`; }
function writeBaseline(result) {
  const output = { version: 1, description: "Known static accessibility findings. New code/file/line tuples fail --baseline.", findings: result.findings };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✓ accessibility baseline 更新: ${rel(BASELINE_PATH)} (${result.findings.length})`);
}
function readBaseline() {
  try {
    const value = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    if (value.version !== 1 || !Array.isArray(value.findings)) throw new Error("invalid schema");
    return value;
  } catch (error) {
    console.error(`✗ accessibility baseline を読めない: ${String(error)}`);
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
const output = { files: result.files, findings: result.findings, regressions, resolved };
if (has("--json")) console.log(JSON.stringify(output, null, 2));
else if (regressions.length === 0) console.log(`✓ accessibility静的回帰なし — ${result.files} files / known ${result.findings.length} / new 0`);
else {
  console.error(`✗ accessibility新規違反: ${regressions.length}`);
  for (const item of regressions) console.error(`  [${item.code}] ${item.file}:${item.line}: ${item.message}`);
}
process.exit(regressions.length === 0 ? 0 : 1);
