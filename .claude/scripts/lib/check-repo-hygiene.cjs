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
    : (process.env.REPO_HYGIENE_BASELINE ?? ".claude/config/repo-hygiene-baseline.json"),
);
const MAX_FILE_SIZE = Number(process.env.REPO_HYGIENE_MAX_BYTES ?? 1_048_576);

function git(args) {
  return execFileSync("git", ["-C", ROOT, ...args], {
    encoding: "buffer",
    maxBuffer: 128 * 1024 * 1024,
  });
}

function listFiles() {
  const command = has("--staged")
    ? ["diff", "--cached", "--name-only", "--diff-filter=ACMR", "-z"]
    : ["ls-files", "-z"];
  return git(command)
    .toString("utf8")
    .split("\0")
    .filter(Boolean)
    .map((file) => file.split(path.sep).join("/"))
    .sort();
}

function finding(code, file, message) {
  return { code, file, message };
}

function inspect(files) {
  const findings = [];
  const forbiddenBasenames = new Set([".DS_Store", "type-check-output.txt"]);
  const forbiddenSuffixes = [".log", ".tmp", ".bak", ".db-shm", ".db-wal"];
  const forbiddenDirs = new Set([".next", ".open-next", "coverage"]);

  for (const file of files) {
    const segments = file.split("/");
    const basename = segments.at(-1);
    if (
      forbiddenBasenames.has(basename) ||
      forbiddenSuffixes.some((suffix) => basename.endsWith(suffix)) ||
      segments.some((segment) => forbiddenDirs.has(segment)) ||
      (/^[^/]+\.(?:db|sqlite|sqlite3)$/.test(file) && !file.startsWith("packages/database/seed/"))
    ) {
      findings.push(finding("FORBIDDEN_ARTIFACT", file, "temporary/build/database artifact is tracked"));
    }

    const absolute = path.join(ROOT, file);
    let stat;
    try {
      stat = fs.statSync(absolute);
    } catch {
      continue;
    }
    if (stat.isFile() && stat.size > MAX_FILE_SIZE) {
      findings.push(
        finding("LARGE_FILE", file, `${stat.size} bytes exceeds ${MAX_FILE_SIZE} bytes`),
      );
    }
  }

  const byCaseFold = new Map();
  const byUnicode = new Map();
  for (const file of files) {
    const caseKey = file.toLocaleLowerCase("en-US");
    const unicodeKey = file.normalize("NFC");
    if (!byCaseFold.has(caseKey)) byCaseFold.set(caseKey, []);
    if (!byUnicode.has(unicodeKey)) byUnicode.set(unicodeKey, []);
    byCaseFold.get(caseKey).push(file);
    byUnicode.get(unicodeKey).push(file);
  }
  for (const paths of byCaseFold.values()) {
    const unique = [...new Set(paths)];
    if (unique.length > 1) {
      findings.push(finding("CASE_COLLISION", unique.join(" | "), "paths differ only by case"));
    }
  }
  for (const paths of byUnicode.values()) {
    const unique = [...new Set(paths)];
    if (unique.length > 1) {
      findings.push(
        finding("UNICODE_COLLISION", unique.join(" | "), "paths differ only by Unicode normalization"),
      );
    }
  }
  return findings.sort((a, b) => `${a.code}\0${a.file}`.localeCompare(`${b.code}\0${b.file}`));
}

function key(item) {
  return `${item.code}\u0000${item.file}`;
}

function writeBaseline(findings) {
  const output = {
    version: 1,
    description: "Known repository hygiene findings. New code/path pairs fail --baseline.",
    maxFileSize: MAX_FILE_SIZE,
    findings,
  };
  fs.mkdirSync(path.dirname(BASELINE_PATH), { recursive: true });
  fs.writeFileSync(BASELINE_PATH, `${JSON.stringify(output, null, 2)}\n`);
  console.log(`✓ repo hygiene baseline 更新: ${path.relative(ROOT, BASELINE_PATH)} (${findings.length})`);
}

function readBaseline() {
  try {
    const baseline = JSON.parse(fs.readFileSync(BASELINE_PATH, "utf8"));
    if (baseline.version !== 1 || !Array.isArray(baseline.findings)) throw new Error("invalid schema");
    return baseline;
  } catch (error) {
    console.error(`✗ repo hygiene baseline を読めない: ${String(error)}`);
    process.exit(2);
  }
}

const files = listFiles();
const findings = inspect(files);
if (writeIndex !== -1) {
  writeBaseline(findings);
  process.exit(0);
}

let regressions = findings;
let resolved = [];
if (has("--baseline")) {
  const baseline = readBaseline();
  const known = new Set(baseline.findings.map(key));
  const current = new Set(findings.map(key));
  regressions = findings.filter((item) => !known.has(key(item)));
  resolved = baseline.findings.filter((item) => !current.has(key(item)));
}

const output = { checked: files.length, findings, regressions, resolved };
if (has("--json")) console.log(JSON.stringify(output, null, 2));
else if (regressions.length === 0) {
  console.log(`✓ repo hygiene 悪化なし — ${files.length} files / known ${findings.length} / new 0`);
} else {
  console.error(`✗ repo hygiene 新規違反: ${regressions.length}`);
  for (const item of regressions) console.error(`  [${item.code}] ${item.file}: ${item.message}`);
}
process.exit(regressions.length === 0 ? 0 : 1);
