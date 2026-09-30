/**
 * 商品の週次実売 (純関数)。週次 Issue の NSM 節 (nsm-revenue-lines.mjs) と KPI ツリーの「有料購入」
 * (measurement-cycle.mjs) が同じ計算を使う。
 *
 * 入力 `revenueHistory` は認証付き収集が毎日足す `.claude/state/metrics/authenticated/revenue-history.json`
 * (summarize.mjs が書く)。チャネルごとに意味が違うので、足し方もチャネルごとに固定する。
 * - coconala … 売上管理の「累積売上」(手数料控除後・取引完了時点で計上)。単調増加なので
 *              週の実売 = 週末時点の累積 − 週初め前の累積
 * - kdp      … Reports の日別「電子書籍ロイヤリティ見積り」と有料注文数。7 日そろった週だけ合計する
 * - note     … 売上 API の「今月の売上」(手数料控除前) と締め済みの月別売上 (closedMonths)。
 *              同じ月なら今月の売上の増分、月をまたいだら「前月の締め額 − 基準点の今月売上 + 週末の今月売上」
 *
 * 欠測は 0 にしない。判定できない理由を note に書き、status を unmeasurable にする。
 */

export const REVENUE_CHANNELS = ["coconala", "kdp", "note"];

const yen = (value) => `¥${Number(value ?? 0).toLocaleString("ja-JP")}`;

function entriesOf(history, channel) {
  const entries = Array.isArray(history?.entries) ? history.entries : [];
  return entries.filter((e) => e?.channel === channel && typeof e.date === "string").sort((a, b) => a.date.localeCompare(b.date));
}

/** 累積値の差分。週初め前の基準点が無くても、週末時点の累積が 0 なら今週も 0 と確定できる。 */
function cumulativeWeek(entries, { weekStart, weekEnd, yenKey, countKey }) {
  const end = entries.filter((e) => e.date <= weekEnd).at(-1);
  if (!end) return { status: "unmeasurable", note: "今週末までの観測が無い" };
  if (end.date < weekStart) return { status: "unmeasurable", note: `最終観測 ${end.date} が週より前` };
  const base = entries.filter((e) => e.date < weekStart).at(-1);
  if (!base) {
    if (end[yenKey] === 0) return { status: "ok", yen: 0, count: countKey ? 0 : null, basis: `累積 ¥0 (${end.date})` };
    return { status: "unmeasurable", note: `週初め前の基準点が無い (最初の観測 ${entries[0].date})` };
  }
  const delta = end[yenKey] - base[yenKey];
  if (!Number.isFinite(delta) || delta < 0) return { status: "unmeasurable", note: "累積が減っている (返金か画面の変更)" };
  const count = countKey && Number.isFinite(end[countKey]) && Number.isFinite(base[countKey]) ? end[countKey] - base[countKey] : null;
  return { status: "ok", yen: delta, count, basis: `累積 ${base.date}→${end.date}` };
}

function kdpWeek(entries, { weekStart, weekEnd }) {
  const days = entries.filter((e) => e.date >= weekStart && e.date <= weekEnd);
  const unique = new Map(days.map((e) => [e.date, e]));
  if (unique.size < 7) return { status: "unmeasurable", note: `日別の観測 ${unique.size}/7 日` };
  const rows = [...unique.values()];
  return {
    status: "ok",
    yen: rows.reduce((sum, e) => sum + (Number(e.royaltyYen) || 0), 0),
    count: rows.reduce((sum, e) => sum + (Number(e.paidOrders) || 0), 0),
    basis: "ロイヤリティ見積り 7 日分",
  };
}

function noteWeek(entries, { weekStart, weekEnd }) {
  const end = entries.filter((e) => e.date <= weekEnd).at(-1);
  if (!end) return { status: "unmeasurable", note: "今週末までの観測が無い" };
  if (end.date < weekStart) return { status: "unmeasurable", note: `最終観測 ${end.date} が週より前` };
  const base = entries.filter((e) => e.date < weekStart).at(-1);
  if (!base) return { status: "unmeasurable", note: `週初め前の基準点が無い (最初の観測 ${entries[0].date})` };
  let delta = end.monthToDateYen - base.monthToDateYen;
  if (end.month !== base.month) {
    const closed = end.closedMonths?.[base.month];
    const skipped = Object.keys(end.closedMonths ?? {}).some((m) => m > base.month && m < end.month);
    if (!Number.isFinite(closed) || skipped) return { status: "unmeasurable", note: `${base.month} の締め額が読めない` };
    delta = closed - base.monthToDateYen + end.monthToDateYen;
  }
  if (!Number.isFinite(delta) || delta < 0) return { status: "unmeasurable", note: "売上が減っている (返金か画面の変更)" };
  return { status: "ok", yen: delta, count: null, basis: `販売額・手数料控除前 ${base.date}→${end.date}` };
}

/**
 * @param {{ revenueHistory: object|null, weekStart: string, weekEnd: string }} input
 * @returns {{ channels: Record<string, {status, yen?, count?, basis?, note?}>, status: string, yen: number|null, count: number|null }}
 */
export function weeklyProductRevenue({ revenueHistory, weekStart, weekEnd }) {
  const window = { weekStart, weekEnd };
  const channels = {
    coconala: cumulativeWeek(entriesOf(revenueHistory, "coconala"), { ...window, yenKey: "cumulativeYen", countKey: null }),
    kdp: kdpWeek(entriesOf(revenueHistory, "kdp"), window),
    note: noteWeek(entriesOf(revenueHistory, "note"), window),
  };
  const all = Object.values(channels);
  const complete = all.every((c) => c.status === "ok");
  return {
    channels,
    status: complete ? "ok" : "unmeasurable",
    yen: complete ? all.reduce((sum, c) => sum + c.yen, 0) : null,
    count: complete && all.every((c) => c.count != null || c.yen === 0) ? all.reduce((sum, c) => sum + (c.count ?? 0), 0) : null,
  };
}

const LABEL = { coconala: "ココナラ", kdp: "KDP", note: "note" };

/** チャネル別の 1 行説明 (週次 Issue 用)。 */
export function describeChannel(name, result) {
  if (result.status !== "ok") return `${LABEL[name]} 判定不能（${result.note}）`;
  const count = result.count == null ? "" : `・${result.count} 件`;
  return `${LABEL[name]} ${yen(result.yen)}${count}（${result.basis}）`;
}
