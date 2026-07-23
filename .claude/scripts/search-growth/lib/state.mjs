/**
 * state — search-growth の derived state 入出力 (再生成可能)。
 * 正典: docs/02_実装計画/39 §4.1。raw snapshot は既存配置を尊重し、ここには normalized/derived のみ置く。
 */
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./sources.mjs";

export const STATE_DIR = path.join(PROJECT_ROOT, ".claude/state/search-growth");
export const PATHS = {
  latest: path.join(STATE_DIR, "latest.json"),
  candidates: path.join(STATE_DIR, "candidates.json"),
  health: path.join(STATE_DIR, "health.json"),
  manifests: path.join(STATE_DIR, "manifests"),
  pastEffects: path.join(STATE_DIR, "past-effects.json"),
};

export function ensureDir(p) {
  fs.mkdirSync(p, { recursive: true });
}
export function readJson(p, fallback = null) {
  try {
    return JSON.parse(fs.readFileSync(p, "utf8"));
  } catch {
    return fallback;
  }
}
export function writeJson(p, obj) {
  ensureDir(path.dirname(p));
  fs.writeFileSync(p, JSON.stringify(obj, null, 2) + "\n");
}

/** 現在の ISO 週 "YYYY-Www"。 */
export function currentIsoWeek(now = new Date()) {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const wk = Math.ceil(((d - yearStart) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(wk).padStart(2, "0")}`;
}

/** CLI arg 取得 (簡易)。 */
export function getArg(argv, flag, fallback = null) {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}
export function hasFlag(argv, flag) {
  return argv.includes(flag);
}
