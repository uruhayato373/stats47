/**
 * check-x-post-budget.cjs — X 投稿頻度ガード (SSOT: sns-content-standards.md §1 quota)
 *
 * X 投稿の頻度ガード。上限は x-catalog 経由で
 * §1 の `X_DAILY_MAX` / `X_WEEKLY_TARGET_MIN` / `X_WEEKLY_TARGET_MAX` を読む
 * (ハードコードしない)。posts.json の X 投稿 (status=scheduled|posted) を JST 日付で数える。
 *
 * ハード上限: 1 日 `X_DAILY_MAX` 本 / 週 `X_WEEKLY_TARGET_MAX` 本。超過で exit 1。
 * `X_WEEKLY_TARGET_MIN` は「その週まだ積める」目安 (下回っても error ではない)。
 *
 * API:
 *   jstDateOf(post)               → "YYYY-MM-DD" (scheduled_at ISO or posted_at から)
 *   countByDay()                  → { "YYYY-MM-DD": n } (x, scheduled|posted のみ)
 *   dayCount(dateStr)             → その JST 日の本数
 *   weekCount(weekStartMondayStr) → その週(月〜日)の本数
 *   canSchedule(dateStr)          → { ok, dayCount, weekCount, dailyMax, weeklyMax, reason }
 *   isoWeekStart(dateStr)         → その日を含む週の月曜 "YYYY-MM-DD"
 *
 * CLI:
 *   node .claude/scripts/sns/check-x-post-budget.cjs [--date YYYY-MM-DD]
 *     → その日(既定=今日)を含む週の日別集計 + quota を表示。日次上限超過があれば exit 1
 */

const path = require("node:path");
const store = require(path.resolve(__dirname, "../lib/sns-posts-store.cjs"));
const catalog = require(path.resolve(__dirname, "../lib/x-catalog.cjs"));

/** post の JST カレンダー日付 ("YYYY-MM-DD")。scheduled_at(ISO) 優先、無ければ posted_at。 */
function jstDateOf(post) {
  const raw = post.scheduled_at || post.posted_at || "";
  if (!raw) return null;
  // posted_at は既に "YYYY-MM-DD" (JST) 形式のことが多い。
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const d = new Date(raw);
  if (isNaN(d.getTime())) return raw.slice(0, 10) || null;
  // JST に変換して日付部分を取る
  const jst = new Date(d.getTime() + 9 * 60 * 60 * 1000);
  return jst.toISOString().slice(0, 10);
}

function activeXPosts() {
  return store
    .loadAll()
    .filter(
      (p) =>
        p.platform === "x" &&
        (p.status === "scheduled" || p.status === "posted") &&
        !p.deleted_at,
    );
}

function countByDay() {
  const out = {};
  for (const p of activeXPosts()) {
    const d = jstDateOf(p);
    if (!d) continue;
    out[d] = (out[d] || 0) + 1;
  }
  return out;
}

function dayCount(dateStr) {
  return countByDay()[dateStr] || 0;
}

/** dateStr を含む週の月曜 (JST) を "YYYY-MM-DD" で返す。 */
function isoWeekStart(dateStr) {
  // 日付だけの計算を UTC で行う。JST 00:00 を Date 化して getUTCDay() すると
  // UTC では前日になり、月曜始まりが1日ずれる。
  const d = new Date(`${dateStr}T00:00:00Z`);
  const dow = (d.getUTCDay() + 6) % 7; // 月=0 ... 日=6
  d.setUTCDate(d.getUTCDate() - dow);
  return d.toISOString().slice(0, 10);
}

function weekCount(weekStartMondayStr) {
  const start = new Date(`${weekStartMondayStr}T00:00:00+09:00`);
  const byDay = countByDay();
  let total = 0;
  for (let i = 0; i < 7; i++) {
    const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
    const jst = new Date(day.getTime() + 9 * 60 * 60 * 1000);
    const key = jst.toISOString().slice(0, 10);
    total += byDay[key] || 0;
  }
  return total;
}

/** dateStr にもう 1 本足せるか (日次・週次のハード上限を判定)。 */
function canSchedule(dateStr) {
  const { dailyMax, weeklyTargetMax } = catalog.getQuota();
  const dc = dayCount(dateStr);
  const wc = weekCount(isoWeekStart(dateStr));
  if (dc >= dailyMax) {
    return {
      ok: false,
      dayCount: dc,
      weekCount: wc,
      dailyMax,
      weeklyMax: weeklyTargetMax,
      reason: `${dateStr} は既に ${dc} 本 (日次上限 ${dailyMax})`,
    };
  }
  if (wc >= weeklyTargetMax) {
    return {
      ok: false,
      dayCount: dc,
      weekCount: wc,
      dailyMax,
      weeklyMax: weeklyTargetMax,
      reason: `週 (${isoWeekStart(dateStr)}〜) は既に ${wc} 本 (週上限 ${weeklyTargetMax})`,
    };
  }
  return {
    ok: true,
    dayCount: dc,
    weekCount: wc,
    dailyMax,
    weeklyMax: weeklyTargetMax,
    reason: "ok",
  };
}

module.exports = {
  jstDateOf,
  countByDay,
  dayCount,
  weekCount,
  isoWeekStart,
  canSchedule,
  activeXPosts,
};

// ---------- CLI ----------
if (require.main === module) {
  const args = process.argv.slice(2);
  const di = args.indexOf("--date");
  // Date.now を避けられない CLI 実行なので new Date() で今日 (JST) を求める
  const today = new Date(Date.now() + 9 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const anchor = di >= 0 ? args[di + 1] : today;
  try {
    const quota = catalog.getQuota();
    const weekStart = isoWeekStart(anchor);
    const byDay = countByDay();
    const start = new Date(`${weekStart}T00:00:00+09:00`);
    let overflow = false;
    const rows = [];
    for (let i = 0; i < 7; i++) {
      const day = new Date(start.getTime() + i * 24 * 60 * 60 * 1000);
      const jst = new Date(day.getTime() + 9 * 60 * 60 * 1000);
      const key = jst.toISOString().slice(0, 10);
      const n = byDay[key] || 0;
      if (n > quota.dailyMax) overflow = true;
      rows.push(`  ${key}: ${n} 本${n > quota.dailyMax ? " ⚠️ 日次上限超過" : ""}`);
    }
    const wc = weekCount(weekStart);
    console.log(`[check-x-post-budget] 週 ${weekStart}〜 (基準日 ${anchor})`);
    console.log(rows.join("\n"));
    console.log(
      `  週合計: ${wc} 本 (目安 ${quota.weeklyTargetMin}-${quota.weeklyTargetMax} / 日次上限 ${quota.dailyMax})`,
    );
    if (overflow || wc > quota.weeklyTargetMax) {
      console.error(
        `🚨 上限超過 (日次 ${quota.dailyMax} / 週次 ${quota.weeklyTargetMax})。予約を減らしてください。`,
      );
      process.exit(1);
    }
    process.exit(0);
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
}
