/**
 * check-asp-apply-budget.cjs — もしも / afb 提携申請の頻度ガード。
 *
 * ★ A8 には `check-a8-apply-budget.cjs` があるのに、もしも / afb は**上限が無かった**
 *   (2026-07-28 に判明)。同じ口座に doboku-note が同居しており、短時間に大量申請すると
 *   アカウント全体のリスクになる。ASP ごとに週上限を機械強制する。
 *
 * 上限は config `.claude/config/affiliate-asp.json` の `asps.<name>.weeklyApplyMax` を読む
 * (ハードコードしない)。未設定なら既定 10。**これは各 ASP が公表している数字ではなく、
 * 自動操作のリスクを見て自分たちで置いた値**。緩めるなら実績を見てから。
 *
 * 申請履歴は `.claude/state/ads/affiliate-catalog.json` の
 * `programs[].asps[<name>].history[] = {at, status:"applying"}` から JST 週で集計する。
 *
 * API:
 *   loadCatalog()                        → affiliate-catalog.json (無ければ {programs:{}})
 *   appliedDates(catalog, asp)           → ["YYYY-MM-DD", ...] (JST 日付)
 *   isoWeekStart(dateStr)                → その日を含む週の月曜 "YYYY-MM-DD"
 *   applyBudget(catalog, asp, dateStr, max) → { ok, weekCount, remaining, max, weekStart }
 *
 * CLI:
 *   node .claude/scripts/ads/check-asp-apply-budget.cjs --asp moshimo [--date YYYY-MM-DD]
 *     → 今週の申請件数 + 残枠を表示。上限到達なら exit 1。
 */

const fs = require("node:fs");
const path = require("node:path");

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const CATALOG_PATH = path.join(PROJECT_ROOT, ".claude/state/ads/affiliate-catalog.json");
const CONFIG_PATH = path.join(PROJECT_ROOT, ".claude/config/affiliate-asp.json");
const DEFAULT_MAX = 10;

function loadCatalog() {
  try {
    return JSON.parse(fs.readFileSync(CATALOG_PATH, "utf-8"));
  } catch {
    return { programs: {} };
  }
}

function loadMax(aspName) {
  try {
    const cfg = JSON.parse(fs.readFileSync(CONFIG_PATH, "utf-8"));
    return cfg.asps?.[aspName]?.weeklyApplyMax ?? DEFAULT_MAX;
  } catch {
    return DEFAULT_MAX;
  }
}

/** ISO 文字列 → JST の "YYYY-MM-DD"。ASP の営業日は日本時間で数える。 */
function toJstDate(iso) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function appliedDates(catalog, aspName) {
  const out = [];
  for (const p of Object.values(catalog.programs ?? {})) {
    const entry = p.asps?.[aspName];
    for (const h of entry?.history ?? []) {
      if (h.status !== "applying") continue;
      const d = toJstDate(h.at);
      if (d) out.push(d);
    }
  }
  return out.sort();
}

/** その日を含む週の月曜 (JST 基準の日付文字列で計算する)。 */
function isoWeekStart(dateStr) {
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 月曜=0
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function applyBudget(catalog, aspName, dateStr, max) {
  const limit = max ?? loadMax(aspName);
  const weekStart = isoWeekStart(dateStr);
  const weekCount = appliedDates(catalog, aspName).filter((d) => isoWeekStart(d) === weekStart).length;
  return { ok: weekCount < limit, weekCount, remaining: Math.max(0, limit - weekCount), max: limit, weekStart };
}

module.exports = { loadCatalog, loadMax, appliedDates, isoWeekStart, applyBudget, toJstDate };

if (require.main === module) {
  const args = process.argv.slice(2);
  const at = (f) => {
    const i = args.indexOf(f);
    return i >= 0 ? args[i + 1] : null;
  };
  const aspName = at("--asp");
  if (!aspName) {
    console.error("usage: --asp <moshimo|afb> [--date YYYY-MM-DD]");
    process.exit(2);
  }
  const date = at("--date") ?? toJstDate(new Date().toISOString());
  const b = applyBudget(loadCatalog(), aspName, date);
  console.log(`[check-asp-apply-budget] ${aspName} 週 ${b.weekStart}〜 (基準日 ${date})`);
  console.log(`  今週の申請: ${b.weekCount} 件 / 上限 ${b.max} 件 (残 ${b.remaining})`);
  if (!b.ok) {
    console.error(`  ✗ 週上限に到達。今週はこれ以上申請しない`);
    process.exit(1);
  }
}
