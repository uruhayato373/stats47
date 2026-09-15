"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");

// Match both document validators' input trees, including ignored/untracked inputs.
// ctime detects rewrites even when a caller restores size and mtime.
function fingerprint(root, now = new Date()) {
  const hash = createHash("sha256");
  hash.update(`v1:${process.version}:${now.toISOString().slice(0, 10)}`);
  function visit(relative) {
    const absolute = path.join(root, relative);
    let stat;
    try { stat = fs.lstatSync(absolute, { bigint: true }); }
    catch (error) {
      if (error.code === "ENOENT") { hash.update(`${relative}:missing\n`); return; }
      throw error;
    }
    hash.update(`${relative}:${stat.mode}:${stat.size}:${stat.mtimeNs}:${stat.ctimeNs}\n`);
    if (stat.isSymbolicLink()) {
      hash.update(fs.readlinkSync(absolute));
      // Validators can read linked files, but do not traverse linked directories.
      try {
        const target = fs.statSync(absolute, { bigint: true });
        if (target.isDirectory()) throw new Error('Linked input directory requires full validation');
        hash.update(`${target.mode}:${target.size}:${target.mtimeNs}:${target.ctimeNs}`);
      } catch (error) { if (error.code !== "ENOENT") throw error; }
    } else if (stat.isDirectory()) {
      for (const name of fs.readdirSync(absolute).sort()) {
        if (["node_modules", ".git", ".next"].includes(name)) continue;
        const child = `${relative}/${name}`;
        if (child === ".claude/worktrees") continue;
        visit(child);
      }
    }
  }
  try {
    for (const p of [".claude", "docs", ".github", "apps", "packages", "CLAUDE.md", "AGENTS.md", "package.json", "package-lock.json", "node_modules/.package-lock.json"])
      visit(p);
    return hash.digest("hex");
  } catch { return null; } // Incomplete scan must never authorize a cache hit.
}

function readSuccess(file, key) {
  if (!key) return false;
  try { return JSON.parse(fs.readFileSync(file, "utf8")).key === key; }
  catch { return false; }
}

function writeSuccess(file, before, after) {
  if (!before || before !== after) return;
  try {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, JSON.stringify({ key: before }));
  } catch { /* Cache failure must not change the validation result. */ }
}
module.exports = { fingerprint, readSuccess, writeSuccess };
