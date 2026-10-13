/**
 * AdSense の週次収益を NSM 節と KPI `ad-yield` へ渡す (純関数)。
 *
 * AdSense は 2026-08-29 に本番から外し、2026-10-11 15:43 JST に新アカウント (pub-9055416085403520) の
 * 手動枠 11 ユニットで再開した (backlog `ADSENSE-RESTART-01`)。週キーは確定 7 日 (日曜〜土曜) で、
 * 再開日を含む最初の週は 2026-W42 (10-11〜10-17。初日は 15:43 以降だけ配信)。
 *
 * - 再開前の週 (`< ADSENSE_LIVE_SINCE_WEEK`) は配信していないので ¥0 と言い切る
 * - 再開後の週は `data/adsense/history.csv` の行だけを根拠にする。行が無ければ (API の権限切れ・取得失敗)
 *   0 円にせず「判定不能」と書く (`project_monetization_contract`)
 */

export const ADSENSE_RESTART_DATE = "2026-10-11";
export const ADSENSE_LIVE_SINCE_WEEK = "2026-W42";
/** 収益が 0 円だった配信停止の期間 (この間の週は history.csv の行が無くても ¥0) */
export const ADSENSE_PAUSED_SINCE_WEEK = "2026-W35";

const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));

/** ISO 週キー ("2026-W42") は同じ書式どうしなら文字列比較で前後が決まる */
export function isAdsenseLiveWeek(week) {
  return week >= ADSENSE_LIVE_SINCE_WEEK;
}

/** history.csv の週の確定 7 日収益。行が無い・値が読めなければ null */
export function adsenseEarningsOf(history, week) {
  const row = (history ?? []).find((r) => r.week === week);
  return row ? num(row.earnings) : null;
}

/** 週次 Issue の「週次収益 (NSM)」節の AdSense 行 */
export function adsenseRevenueLine({ history, week }) {
  if (week >= ADSENSE_PAUSED_SINCE_WEEK && !isAdsenseLiveWeek(week)) {
    return `- AdSense: **¥0**（2026-08-29〜2026-10-10 は配信停止。${ADSENSE_RESTART_DATE} に手動枠で再開）`;
  }
  const earnings = adsenseEarningsOf(history, week);
  if (earnings == null) {
    return (
      `- AdSense: **判定不能**（AdSense の history.csv に ${week} の行が無い。週次取得の失敗か API の権限切れ。` +
      "fetch-metrics-weekly.yml の「Fetch AdSense snapshot」と ADSENSE-RESTART-01 を確認する）"
    );
  }
  const row = history.find((r) => r.week === week);
  const pv = num(row.page_views);
  const imp = num(row.impressions);
  const view = num(row.viewability);
  const parts = [
    pv == null ? null : `AdSense の数えた PV ${pv.toLocaleString("ja-JP")}`,
    imp == null ? null : `表示 ${imp.toLocaleString("ja-JP")}`,
    view == null ? null : `視認率 ${(view * 100).toFixed(1)}%`,
  ].filter(Boolean);
  const partial = week === ADSENSE_LIVE_SINCE_WEEK ? "。再開初週で 10-11 は 15:43 以降だけ" : "";
  return `- AdSense (確定 7 日・推定収益): **¥${earnings.toLocaleString("ja-JP")}**${parts.length ? `（${parts.join(" / ")}${partial}）` : partial ? `（${partial.slice(1)}）` : ""}`;
}

/**
 * 28 日の広告収益効率 = AdSense 確定 7 日 × 4 週の収益 ÷ GA4 Japan PV 28 日 × 1,000。
 * 4 週すべてが再開後で、AdSense の行が全部そろうときだけ値を返す (部分和を 28 日と呼ばない)。
 *
 * @param {{history: Array<object>|null, weeks: string[], pageviews28d: number|null}} input
 * @returns {{status:"ok", value:number, earnings:number} | {status:"pending"|"missing", reason:string}}
 */
export function adYield28d({ history, weeks, pageviews28d }) {
  const before = weeks.filter((w) => !isAdsenseLiveWeek(w));
  if (before.length > 0) {
    return { status: "pending", reason: `再開 (${ADSENSE_RESTART_DATE}) 前の週 ${before.join("・")} を含む。再開後 4 週は ${ADSENSE_LIVE_SINCE_WEEK} から数える` };
  }
  const earnings = weeks.map((w) => adsenseEarningsOf(history, w));
  const lacking = weeks.filter((_, i) => earnings[i] == null);
  if (lacking.length > 0) return { status: "missing", reason: `AdSense の history.csv に ${lacking.join("・")} の行が無い` };
  if (pageviews28d == null || pageviews28d <= 0) return { status: "missing", reason: "GA4 Japan PV の 28 日がそろっていない" };
  const total = earnings.reduce((a, b) => a + b, 0);
  return { status: "ok", value: Math.round((total / pageviews28d) * 1000 * 10) / 10, earnings: total };
}
