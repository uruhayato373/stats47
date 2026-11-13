/**
 * 週次収益 (NSM) の内訳を構造化して返す (純関数)。
 *
 * 収益化戦略 §1 の定義は「週次収益 = AdSense 確定額 + アフィリエイト発生額 + 商品の実売額」。
 * 週次 Issue の NSM 節 (generate-weekly-metrics-issue.mjs) は同じ入力を文章の行にするが、KPI ツリーの
 * `weekly-revenue` は値を持たず「内訳あり」とだけ出していた (2026-11-14 ADMIN-HOME-KPI-01)。
 * KPI ツリーと管理画面のホームはこの関数の結果を使う。
 *
 * 足し方の約束:
 * - 合計に入れるのは「その週の円」が分かるチャネルだけ (AdSense の確定 7 日・商品の週次実売)
 * - ASP (A8・楽天) は月累計しか記録が無いので合計に入れず、月累計として並べる
 * - KDP のロイヤリティは見積りなので合計に入れない (product-revenue.mjs の約束)
 * - 1 つでも判定不能のチャネルがあれば合計は「判定できた分」と明示し、全体の値にしない (欠測を 0 円にしない)
 */

import { adsenseEarningsOf, ADSENSE_PAUSED_SINCE_WEEK, isAdsenseLiveWeek } from "./adsense-revenue.mjs";
import { weeklyProductRevenue } from "./product-revenue.mjs";
import { a8Result, rakutenResult } from "../nsm-revenue-lines.mjs";

/**
 * @typedef {{
 *   id: string, label: string, period: "week"|"month-to-date",
 *   status: "ok"|"unmeasurable", yen: number|null, inTotal: boolean, detail: string
 * }} RevenueChannel
 */

const yen = (v) => `¥${Number(v ?? 0).toLocaleString("ja-JP")}`;

/** @returns {RevenueChannel} */
function adsenseChannel(history, week) {
  const base = { id: "adsense", label: "AdSense", period: /** @type {const} */ ("week"), inTotal: true };
  if (week >= ADSENSE_PAUSED_SINCE_WEEK && !isAdsenseLiveWeek(week)) {
    return { ...base, status: "ok", yen: 0, detail: "配信停止中の週" };
  }
  const earnings = adsenseEarningsOf(history, week);
  if (earnings == null) return { ...base, status: "unmeasurable", yen: null, detail: `AdSense の history.csv に ${week} の行が無い` };
  return { ...base, status: "ok", yen: earnings, detail: "確定 7 日の推定収益" };
}

/**
 * @param {{
 *   week: string, weekStart: string, weekEnd: string, asOf: Date,
 *   adsenseHistory: Array<object>|null, revenueHistory: object|null,
 *   authLatest: object|null, a8Results: object|null, rakutenResults: object|null,
 * }} input
 * @returns {{ week: string, status: "ok"|"partial"|"unmeasurable", totalYen: number|null, measuredYen: number, channels: RevenueChannel[], unmeasurable: string[] }}
 */
export function summarizeWeeklyRevenue({ week, weekStart, weekEnd, asOf, adsenseHistory, revenueHistory, authLatest, a8Results, rakutenResults }) {
  const product = weeklyProductRevenue({ revenueHistory, weekStart, weekEnd });
  const note = product.channels.note;
  const kdp = product.channels.kdp;
  const a8 = a8Result({ authLatest, a8Results, asOf });
  const rakuten = rakutenResult(rakutenResults, asOf);

  /** @type {RevenueChannel[]} */
  const channels = [
    adsenseChannel(adsenseHistory, week),
    note.status === "ok"
      ? { id: "note", label: "note", period: "week", status: "ok", yen: note.yen ?? 0, inTotal: true, detail: note.basis ?? "" }
      : { id: "note", label: "note", period: "week", status: "unmeasurable", yen: null, inTotal: true, detail: note.note ?? "" },
    kdp.status === "ok"
      ? { id: "kdp", label: "Kindle", period: "week", status: "ok", yen: kdp.yen ?? 0, inTotal: false, detail: `ロイヤリティ見積り・有料注文 ${kdp.count ?? 0} 件 (見積りなので合計に入れない)` }
      : { id: "kdp", label: "Kindle", period: "week", status: "unmeasurable", yen: null, inTotal: false, detail: kdp.note ?? "" },
    a8.status === "ok"
      ? { id: "a8", label: "A8", period: "month-to-date", status: "ok", yen: a8.confirmedYen, inTotal: false, detail: `${a8.month} 月累計・発生 ${a8.conversions} 件・確定 ${a8.approved} 件 (月累計なので合計に入れない)` }
      : { id: "a8", label: "A8", period: "month-to-date", status: "unmeasurable", yen: null, inTotal: false, detail: a8.reason },
    rakuten.status === "ok"
      ? { id: "rakuten", label: "楽天", period: "month-to-date", status: "ok", yen: rakuten.estimatedYen, inTotal: false, detail: `${rakuten.month} 月累計・発生 ${rakuten.orders} 件・確定 ${rakuten.confirmedYen == null ? "未確定" : yen(rakuten.confirmedYen)} (月累計なので合計に入れない)` }
      : { id: "rakuten", label: "楽天", period: "month-to-date", status: "unmeasurable", yen: null, inTotal: false, detail: rakuten.reason },
  ];

  const summed = channels.filter((c) => c.inTotal);
  const measuredYen = summed.filter((c) => c.status === "ok").reduce((sum, c) => sum + (c.yen ?? 0), 0);
  const unmeasurable = channels.filter((c) => c.status !== "ok").map((c) => c.label);
  const summedMissing = summed.filter((c) => c.status !== "ok");
  const status = summedMissing.length === 0 ? "ok" : summedMissing.length === summed.length ? "unmeasurable" : "partial";
  return { week, status, totalYen: status === "ok" ? measuredYen : null, measuredYen, channels, unmeasurable };
}

/** KPI ツリーの `weekly-revenue` の 1 行 (measurement-cycle.mjs が使う) */
export function weeklyRevenueNode(summary) {
  const missing = summary.channels.filter((c) => c.status !== "ok").map((c) => `${c.label} 判定不能 (${c.detail})`);
  const note = missing.length ? missing.join(" / ") : "AdSense と note の週次の合計。A8・楽天は月累計、Kindle は見積りなので別に並べる";
  if (summary.status === "ok") return { status: "ok", value: `${summary.totalYen}`, previous: null, note };
  if (summary.status === "partial") {
    return { status: "partial", value: null, previous: null, note: `判定できた分 ${yen(summary.measuredYen)}。${note}` };
  }
  return { status: "unmeasurable", value: null, previous: null, note };
}
