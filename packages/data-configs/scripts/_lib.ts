import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = resolve(__dirname, "../../..");
export const PACKAGE_ROOT = resolve(__dirname, "..");
export const METRICS_DIR = resolve(PACKAGE_ROOT, "src/metrics");
export const REGISTRY_FILE = resolve(PACKAGE_ROOT, "src/registry.ts");
export const D1_PATH = resolve(
  REPO_ROOT,
  ".local/d1/v3/d1/miniflare-D1DatabaseObject/baffe56c6b0173e34c63a5333065bcdb6642a01b4c2cfecd70ad3607b00c9972.sqlite",
);

/** kebab-case key → camelCase identifier (for TS variable name) */
export function keyToIdentifier(key: string): string {
  return key
    .split(/[-_]/)
    .map((part, i) =>
      i === 0
        ? part
        : part.charAt(0).toUpperCase() + part.slice(1),
    )
    .join("")
    .replace(/[^a-zA-Z0-9_]/g, "_");
}

/** kebab-case key → file basename (= key.ts) */
export function keyToFilename(key: string): string {
  return `${key}.ts`;
}

/** TS object literal formatter (manual, no eval) */
export function formatTsValue(v: unknown, indent = 0): string {
  const pad = (n: number) => "  ".repeat(n);
  if (v === null || v === undefined) return "undefined";
  if (typeof v === "string") return JSON.stringify(v);
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  if (Array.isArray(v)) {
    if (v.length === 0) return "[]";
    const items = v.map((x) => `${pad(indent + 1)}${formatTsValue(x, indent + 1)}`).join(",\n");
    return `[\n${items},\n${pad(indent)}]`;
  }
  if (typeof v === "object") {
    const entries = Object.entries(v as Record<string, unknown>).filter(
      ([, val]) => val !== undefined,
    );
    if (entries.length === 0) return "{}";
    const items = entries
      .map(([k, val]) => `${pad(indent + 1)}${JSON.stringify(k)}: ${formatTsValue(val, indent + 1)}`)
      .join(",\n");
    return `{\n${items},\n${pad(indent)}}`;
  }
  return "undefined";
}
