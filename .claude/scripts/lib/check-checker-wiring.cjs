#!/usr/bin/env node
"use strict";

const { execFileSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const args = process.argv.slice(2);
const has = (value) => args.includes(value);
const writeIndex = args.indexOf("--write-baseline");
const baselineArg = writeIndex === -1 ? null : args[writeIndex + 1];
const BASELINE_PATH = path.resolve(
  ROOT,
  baselineArg && !baselineArg.startsWith("--")
    ? baselineArg
    : (process.env.CHECKER_WIRING_BASELINE ?? ".claude/config/checker-wiring-baseline.json"),
);

const SCRIPT_EXTENSIONS = new Set([".cjs", ".mjs", ".js", ".ts", ".sh", ".py"]);
const CORPUS_EXTENSIONS = new Set([
  ...SCRIPT_EXTENSIONS,
  ".json", ".md", ".yml", ".yaml",
]);
const CHECKER_NAME = /(?:^|[-_.])(check|audit|validate|verify|lint|guard)(?:[-_.]|$)/i;

function rel(file) {
  return path.relative(ROOT, file).split(path.sep).join("/");
}

function walk(directory, output = []) {
  let entries;
  try {
    entries = fs.readdirSync(directory, { withFileTypes: true });
  } catch {
    return output;
  }
  for (const entry of entries) {
    if (["node_modules", ".git", ".next", ".open-next", "dist", "coverage", "__tests__"].includes(entry.name)) {
      continue;
    }
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else output.push(absolute);
  }
  return output;
}

function candidateRoots() {
  const roots = [path.join(ROOT, ".claude/scripts")];
  for (const parent of ["apps", "packages"]) {
    const directory = path.join(ROOT, parent);
    let entries = [];
    try {
      entries = fs.readdirSync(directory, { withFileTypes: true });
    } catch {}
    for (const entry of entries) {
      if (entry.isDirectory()) roots.push(path.join(directory, entry.name, "scripts"));
    }
  }
  return roots;
}

function candidates() {
  return candidateRoots()
    .flatMap((root) => walk(root))
    .filter((file) => SCRIPT_EXTENSIONS.has(path.extname(file)))
    .filter((file) => CHECKER_NAME.test(path.basename(file)))
    .sort();
}

/** `.husky/` 直下の拡張子なしファイル (= husky フック本体) か。 */
function isHuskyHook(file) {
  return rel(file).startsWith(".husky/") && path.extname(file) === "";
}

function corpusFiles() {
  const roots = [
    ".github", ".husky", ".claude/skills", ".claude/agents", ".claude/hooks",
    ".claude/scripts", "scripts", "apps", "packages",
  ];
  const files = roots.flatMap((root) => walk(path.join(ROOT, root)));
  const packageFiles = [path.join(ROOT, "package.json")];
  return [...files, ...packageFiles]
    // husky のフックは規約上**拡張子を持たない** (`.husky/pre-commit` / `.husky/commit-msg`)。
    // 拡張子だけで絞ると `.husky` を root に挙げていても中身が 1 件も corpus に入らず、
    // フック経由の配線が原理的に見えない (2026-08-20 に commit-msg フックへ直接配線した
    // ガードが UNWIRED と誤判定されて発覚)。
    // ★ここに具体的なチェッカー名を書かないこと。このファイル自身が corpus なので、
    //   名前を書くと「コメントが配線」として自己参照で常に緑になる (同日に実際に踏んだ)。
    .filter((file) => CORPUS_EXTENSIONS.has(path.extname(file)) || isHuskyHook(file))
    .filter((file) => rel(file) !== rel(BASELINE_PATH));
}

function readSafe(file) {
  try {
    if (fs.statSync(file).size > 800_000) return "";
    return fs.readFileSync(file, "utf8");
  } catch {
    return "";
  }
}

function inspect() {
  const checkerFiles = candidates();
  const corpus = corpusFiles().map((file) => ({ file, text: readSafe(file) }));
  const findings = [];
  for (const checker of checkerFiles) {
    const relative = rel(checker);
    const basename = path.basename(checker);
    const references = corpus.filter(
      (entry) => rel(entry.file) !== relative &&
        (entry.text.includes(relative) || entry.text.includes(basename)),
    );
    if (references.length === 0) {
      findings.push({
        code: "UNWIRED_CHECKER",
        file: relative,
        message: "no workflow/hook/package/skill/agent/script reference found",
      });
    }
  }
  return { checkerFiles: checkerFiles.map(rel), findings };
}

function key(item) {
  return `${item.code}\u0000${item.file}`;
}

function writeBaseline(findings) {
  const output = {
    version: 1,
    description: "Known unwired checker scripts. New code/path pairs fail --baseline.",
    findings,
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✓ checker wiring baseline 更新: ${rel(BASELINE_PATH)} (${findings.length})`);
}

function readBaseline() {
  try {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    if (baseline.version !== 1 || !Array.isArray(baseline.findings)) throw new Error("invalid schema");
    return baseline;
  } catch (error) {
    console.error(`✗ checker wiring baseline を読めない: ${String(error)}`);
    process.exit(2);
  }
}

const result = inspect();
if (writeIndex !== -1) {
  writeBaseline(result.findings);
  process.exit(0);
}

let regressions = result.findings;
let resolved = [];
if (has("--baseline")) {
  const baseline = readBaseline();
  const known = new Set(baseline.findings.map(key));
  const current = new Set(result.findings.map(key));
  regressions = result.findings.filter((item) => !known.has(key(item)));
  resolved = baseline.findings.filter((item) => !current.has(key(item)));
}

const output = {
  checked: result.checkerFiles.length,
  findings: result.findings,
  regressions,
  resolved,
};
if (has("--json")) console.log(JSON.stringify(output, null, 2));
else if (regressions.length === 0) {
  console.log(`✓ checker wiring 悪化なし — ${output.checked} checkers / known ${output.findings.length} / new 0`);
} else {
  console.error(`✗ 新規未配線 checker: ${regressions.length}`);
  for (const item of regressions) console.error(`  [${item.code}] ${item.file}`);
}
process.exit(regressions.length === 0 ? 0 : 1);
