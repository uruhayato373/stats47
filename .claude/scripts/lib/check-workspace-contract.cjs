#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");

const ROOT = process.env.CLAUDE_PROJECT_DIR || path.resolve(__dirname, "..", "..", "..");
const isJson = process.argv.includes("--json");

function workspaceDirectories() {
  const output = [];
  for (const parent of ["apps", "packages"]) {
    const directory = path.join(ROOT, parent);
    let entries = [];
    try { entries = fs.readdirSync(directory, { withFileTypes: true }); } catch {}
    for (const entry of entries) {
      const packageFile = path.join(directory, entry.name, "package.json");
      if (entry.isDirectory() && fs.existsSync(packageFile)) output.push(path.dirname(packageFile));
    }
  }
  return output.sort();
}

function readJson(file, findings) {
  try { return JSON.parse(fs.readFileSync(file, "utf8")); }
  catch (error) {
    findings.push({ code: "INVALID_PACKAGE_JSON", file: path.relative(ROOT, file), message: String(error) });
    return null;
  }
}

function exportTargets(value, output = []) {
  if (typeof value === "string") output.push(value);
  else if (Array.isArray(value)) value.forEach((item) => exportTargets(item, output));
  else if (value && typeof value === "object") Object.values(value).forEach((item) => exportTargets(item, output));
  return output;
}

function normalize(file) {
  return file.split(path.sep).join("/");
}

function findCycles(graph) {
  const cycles = new Set();
  const visiting = new Set();
  const visited = new Set();
  const stack = [];
  function visit(node) {
    if (visiting.has(node)) {
      const start = stack.indexOf(node);
      const members = stack.slice(start);
      const rotations = members.map((_, index) => [...members.slice(index), ...members.slice(0, index)]);
      cycles.add(rotations.map((items) => items.join(" -> ")).sort()[0]);
      return;
    }
    if (visited.has(node)) return;
    visiting.add(node); stack.push(node);
    for (const dependency of graph.get(node) || []) visit(dependency);
    stack.pop(); visiting.delete(node); visited.add(node);
  }
  for (const node of graph.keys()) visit(node);
  return [...cycles].sort();
}

function main() {
  const findings = [];
  const directories = workspaceDirectories();
  const packages = [];
  const names = new Map();
  for (const directory of directories) {
    const file = path.join(directory, "package.json");
    const manifest = readJson(file, findings);
    if (!manifest) continue;
    const relative = normalize(path.relative(ROOT, directory));
    if (!manifest.name) findings.push({ code: "MISSING_NAME", file: `${relative}/package.json`, message: "name is required" });
    else if (names.has(manifest.name)) {
      findings.push({ code: "DUPLICATE_NAME", file: `${relative}/package.json`, message: `${manifest.name} also used by ${names.get(manifest.name)}` });
    } else names.set(manifest.name, relative);
    packages.push({ directory, relative, manifest });
  }

  const packageNames = new Set(packages.map((item) => item.manifest.name).filter(Boolean));
  const graph = new Map();
  for (const item of packages) {
    const source = `${item.relative}/package.json`;
    for (const field of ["main", "types"]) {
      const target = item.manifest[field];
      if (typeof target === "string" && target.startsWith("./") && !fs.existsSync(path.resolve(item.directory, target))) {
        findings.push({ code: "MISSING_ENTRYPOINT", file: source, message: `${field} points to missing ${target}` });
      }
    }
    for (const target of exportTargets(item.manifest.exports)) {
      if (target.startsWith("./") && !target.includes("*") && !fs.existsSync(path.resolve(item.directory, target))) {
        findings.push({ code: "MISSING_EXPORT", file: source, message: `exports points to missing ${target}` });
      }
    }
    const dependencyFields = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies"];
    for (const field of dependencyFields) {
      for (const dependency of Object.keys(item.manifest[field] || {})) {
        if (dependency.startsWith("@stats47/") && !packageNames.has(dependency)) {
          findings.push({ code: "MISSING_WORKSPACE_DEP", file: source, message: `${field}.${dependency} has no workspace package` });
        }
      }
    }
    const runtimeInternal = Object.keys(item.manifest.dependencies || {}).filter((name) => packageNames.has(name));
    graph.set(item.manifest.name, runtimeInternal);
  }
  for (const cycle of findCycles(graph)) {
    findings.push({ code: "WORKSPACE_CYCLE", file: "package graph", message: cycle });
  }

  const lockFile = path.join(ROOT, "package-lock.json");
  const lock = readJson(lockFile, findings);
  if (lock?.packages) {
    for (const item of packages) {
      if (!lock.packages[item.relative]) {
        findings.push({ code: "LOCK_MISSING_WORKSPACE", file: "package-lock.json", message: `${item.relative} is not registered` });
      } else if (lock.packages[item.relative].name && lock.packages[item.relative].name !== item.manifest.name) {
        findings.push({ code: "LOCK_NAME_MISMATCH", file: "package-lock.json", message: `${item.relative}: ${lock.packages[item.relative].name} != ${item.manifest.name}` });
      }
    }
  }

  findings.sort((a, b) => `${a.code}\0${a.file}\0${a.message}`.localeCompare(`${b.code}\0${b.file}\0${b.message}`));
  const byCode = Object.fromEntries([...new Set(findings.map((item) => item.code))].map((code) => [code, findings.filter((item) => item.code === code).length]));
  const output = { workspaces: packages.length, findings, byCode };
  if (isJson) console.log(JSON.stringify(output, null, 2));
  else if (findings.length === 0) console.log(`✓ workspace contract OK — ${packages.length} workspaces`);
  else {
    console.error(`✗ workspace contract: ${findings.length} findings`);
    for (const item of findings) console.error(`  [${item.code}] ${item.file}: ${item.message}`);
  }
  process.exit(findings.length === 0 ? 0 : 1);
}

main();
