import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const PROJECT_ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../..",
);
export const OUT_DIR = path.join(PROJECT_ROOT, "apps/remotion/out");
export const R2_LOCAL = path.join(PROJECT_ROOT, ".local/r2");
export const MANIFEST_PATH = path.join(OUT_DIR, ".archive-manifest.json");

export function loadManifest() {
  if (!fs.existsSync(MANIFEST_PATH)) {
    throw new Error(`manifest not found: ${MANIFEST_PATH}`);
  }
  return JSON.parse(fs.readFileSync(MANIFEST_PATH, "utf-8"));
}

export function listFilesRecursively(dir) {
  const results = [];
  if (!fs.existsSync(dir)) return results;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.name === ".DS_Store" || entry.name.startsWith(".archive-manifest")) {
      continue;
    }
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...listFilesRecursively(full));
    } else if (entry.isFile()) {
      results.push(full);
    }
  }
  return results;
}

function globToRegex(glob) {
  // *.mp4 → ^[^/]*\.mp4$
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, "\\$&").replace(/\*/g, "[^/]*");
  return new RegExp("^" + escaped + "$");
}

export function* iterateSegmentFiles(segment) {
  const srcDir = path.join(OUT_DIR, segment.src_dir);
  const re = segment.include_glob ? globToRegex(segment.include_glob) : null;
  for (const f of listFilesRecursively(srcDir)) {
    if (re && !re.test(path.basename(f))) continue;
    yield f;
  }
}

export function collectKeepPaths(manifest) {
  const absSrcSet = new Set();
  for (const [, project] of Object.entries(manifest.projects ?? {})) {
    for (const item of project.keep ?? []) {
      absSrcSet.add(path.join(OUT_DIR, item.src));
    }
    const segments = Array.isArray(project.sns_segments)
      ? project.sns_segments
      : project.sns_segments
        ? [project.sns_segments]
        : [];
    for (const seg of segments) {
      for (const f of iterateSegmentFiles(seg)) {
        absSrcSet.add(f);
      }
    }
  }
  return absSrcSet;
}

export function formatBytes(n) {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / 1024 / 1024).toFixed(1)} MB`;
  return `${(n / 1024 / 1024 / 1024).toFixed(2)} GB`;
}
