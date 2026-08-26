#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const REGISTRY_PATH = path.resolve(ROOT, process.env.ENV_REGISTRY_PATH ?? ".claude/config/env-registry.json");
const args = process.argv.slice(2);
const isJson = args.includes("--json");
const writeRegistry = args.includes("--write-registry");
const VALID_VISIBILITY = new Set(["public", "server", "secret", "workflow"]);
const TEXT_EXTENSIONS = new Set([".cjs", ".mjs", ".js", ".ts", ".tsx", ".sh", ".yml", ".yaml"]);

function rel(file) { return path.relative(ROOT, file).split(path.sep).join("/"); }
function walk(directory, output = []) {
  let entries = [];
  try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch { return output; }
  for (const entry of entries) {
    if (["node_modules", ".git", ".local", ".next", ".open-next", "dist", "coverage", "__tests__"].includes(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute, output);
    else if (TEXT_EXTENSIONS.has(path.extname(entry.name))) output.push(absolute);
  }
  return output;
}

function sourceFiles() {
  const roots = ["apps", "packages", "scripts", ".claude/scripts", ".claude/hooks", ".github/workflows"];
  const files = roots.flatMap((root) => walk(path.join(ROOT, root)));
  for (const file of ["next.config.ts", "turbo.json"]) {
    const absolute = path.join(ROOT, file);
    if (fs.existsSync(absolute)) files.push(absolute);
  }
  return [...new Set(files)].sort();
}

function addUsage(usages, name, context, file) {
  if (!/^[A-Z][A-Z0-9_]+$/.test(name)) return;
  if (!usages.has(name)) usages.set(name, { contexts: new Set(), files: new Set() });
  usages.get(name).contexts.add(context);
  usages.get(name).files.add(rel(file));
}

function discover() {
  const usages = new Map();
  for (const file of sourceFiles()) {
    let text;
    try { text = fs.readFileSync(file, "utf8"); } catch { continue; }
    const patterns = [
      { context: "process", re: /process\.env\.([A-Z][A-Z0-9_]+)/g },
      { context: "process", re: /process\.env\[["']([A-Z][A-Z0-9_]+)["']\]/g },
      { context: "secret", re: /\$\{\{\s*secrets\.([A-Z][A-Z0-9_]+)\s*\}\}/g },
      { context: "variable", re: /\$\{\{\s*vars\.([A-Z][A-Z0-9_]+)\s*\}\}/g },
    ];
    for (const { context, re } of patterns) {
      let match;
      while ((match = re.exec(text))) addUsage(usages, match[1], context, file);
    }
  }
  return usages;
}

function inferVisibility(name, contexts) {
  if (name.startsWith("NEXT_PUBLIC_")) return "public";
  if (contexts.has("secret")) return "secret";
  if (contexts.has("variable") && !contexts.has("process")) return "workflow";
  return "server";
}

function serializeRegistry(usages) {
  return {
    version: 1,
    description: "Environment variable names and exposure classes. Values must never be stored here.",
    variables: [...usages.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([name, usage]) => ({
      name,
      visibility: inferVisibility(name, usage.contexts),
      contexts: [...usage.contexts].sort(),
    })),
  };
}

function loadRegistry(findings) {
  let registry;
  try { registry = JSON.parse(fs.readFileSync(REGISTRY_PATH, "utf8")); }
  catch (error) {
    findings.push({ code: "REGISTRY_INVALID", name: "", message: String(error) });
    return { variables: [] };
  }
  if (registry.version !== 1 || !Array.isArray(registry.variables)) {
    findings.push({ code: "REGISTRY_INVALID", name: "", message: "version=1 and variables[] are required" });
    return { variables: [] };
  }
  return registry;
}

const usages = discover();
if (writeRegistry) {
  fs.mkdirSync(path.dirname(REGISTRY_PATH), { recursive: true });
  fs.writeFileSync(REGISTRY_PATH, `${JSON.stringify(serializeRegistry(usages), null, 2)}\n`);
  console.log(`✓ env registry 更新: ${rel(REGISTRY_PATH)} (${usages.size} variables; values excluded)`);
  process.exit(0);
}

const findings = [];
const registry = loadRegistry(findings);
const registered = new Map();
for (const variable of registry.variables) {
  if (!variable?.name || !VALID_VISIBILITY.has(variable.visibility)) {
    findings.push({ code: "REGISTRY_ENTRY_INVALID", name: variable?.name ?? "", message: "invalid name or visibility" });
    continue;
  }
  if (registered.has(variable.name)) findings.push({ code: "REGISTRY_DUPLICATE", name: variable.name, message: "duplicate entry" });
  registered.set(variable.name, variable);
  if (variable.visibility === "secret" && variable.name.startsWith("NEXT_PUBLIC_")) {
    findings.push({ code: "SECRET_PUBLIC_PREFIX", name: variable.name, message: "secret must not use NEXT_PUBLIC_" });
  }
}
for (const [name, usage] of usages) {
  if (!registered.has(name)) {
    findings.push({ code: "ENV_UNREGISTERED", name, message: `contexts=${[...usage.contexts].sort().join(",")}` });
  }
  if (name.startsWith("NEXT_PUBLIC_") && /(?:SECRET|TOKEN|PASSWORD|PRIVATE_KEY)/.test(name)) {
    findings.push({ code: "PUBLIC_SENSITIVE_NAME", name, message: "sensitive-looking name is exposed to browser bundle" });
  }
}
findings.sort((a, b) => `${a.code}\0${a.name}`.localeCompare(`${b.code}\0${b.name}`));
const output = { discovered: usages.size, registered: registered.size, findings };
if (isJson) console.log(JSON.stringify(output, null, 2));
else if (findings.length === 0) console.log(`✓ env registry OK — ${usages.size} discovered / ${registered.size} registered`);
else {
  console.error(`✗ env registry: ${findings.length} findings`);
  for (const item of findings) console.error(`  [${item.code}] ${item.name}: ${item.message}`);
}
process.exit(findings.length === 0 ? 0 : 1);
