/**
 * state — search-growth の derived state 入出力 (再生成可能)。
 * 正典: .claude/skills/analytics/search-growth/reference/platform-contract.md。
 * raw snapshot は既存配置を尊重し、ここには normalized/derived のみ置く。
 */
import { isoWeekOf, jstDateOf } from '../../metrics/lib/periods.mjs';
import fs from "node:fs";
import path from "node:path";
import { PROJECT_ROOT } from "./sources.mjs";
import { datasetDir } from "../../../../config/datasets.mjs";

export const STATE_DIR = path.join(PROJECT_ROOT, datasetDir("search-growth.state"));
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
  return isoWeekOf(jstDateOf(now)); // 正本は .claude/scripts/metrics/lib/periods.mjs (JST の暦日で数える。SCRIPT-ISO-WEEK-UNIFY-01)
}

/** CLI arg 取得 (簡易)。 */
export function getArg(argv, flag, fallback = null) {
  const i = argv.indexOf(flag);
  return i >= 0 && argv[i + 1] && !argv[i + 1].startsWith("--") ? argv[i + 1] : fallback;
}
export function hasFlag(argv, flag) {
  return argv.includes(flag);
}
