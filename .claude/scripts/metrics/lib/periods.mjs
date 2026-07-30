/**
 * periods — 週次計測の期間契約 (SSOT・pure)。
 *
 * 正典: .claude/skills/analytics/search-growth/reference/weekly-cycle-contract.md。
 *
 * - finalized7d: 取得遅延を考慮した連続 7 日 (KPI / WoW / フェーズゲート用)
 * - previous7d:  finalized7d 直前の重複しない連続 7 日
 * - rolling28d:  同じ遅延後端の連続 28 日 (page/query/device の機会発見用。WoW 禁止)
 * - effectWindow: 施策 baseline 起点の 14/28/56 日判定日
 *
 * 規約:
 * - 取得遅延日数は DATA_DELAY_DAYS がコード上の SSOT (GSC=3 / GA4=1)。
 * - 日付境界は JST。`weekId` は保存 key であり期間の代用にしない —
 *   明示 week からは「その ISO 週の日曜」を anchor に期間を決定的に再現する。
 * - 過去 week へ実行時点のデータを保存できない (anchor が未来なら throw)。
 * - 日別行の欠損は 0 補完しない。assessDailyCoverage が partial/missing と欠損日を返す。
 *
 * このファイルは純粋 (Node built-ins のみ・now は注入可能)。テスト:
 * .claude/scripts/metrics/__tests__/periods.test.mjs
 */

/**
 * 取得遅延日数の SSOT (検索成長の期間契約)。GSC は原則 3 日、GA4 は原則 1 日。
 * AdSense は 1 日 (推定収益は月次確定まで変動しうる — summary の limitations に明記する)。
 */
export const DATA_DELAY_DAYS = Object.freeze({ gsc: 3, ga4: 1, adsense: 1 });

/** 施策効果判定の窓 (日数)。 */
export const EFFECT_WINDOW_DAYS = Object.freeze([14, 28, 56]);

const DAY_MS = 24 * 60 * 60 * 1000;
const JST_OFFSET_MS = 9 * 60 * 60 * 1000;

/** "YYYY-MM-DD" → UTC 深夜の Date (日付ラベルの算術用)。不正なら throw。 */
function toUtc(dateStr) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(String(dateStr))) {
    throw new Error(`invalid date label: ${String(dateStr)} (expected YYYY-MM-DD)`);
  }
  const ms = Date.parse(dateStr + "T00:00:00Z");
  if (Number.isNaN(ms)) throw new Error(`unparsable date label: ${dateStr}`);
  return new Date(ms);
}

function fmt(d) {
  return d.toISOString().slice(0, 10);
}

/** 日付ラベルに日数を加算する (JST カレンダー上の純粋な日付算術)。 */
export function addDays(dateStr, days) {
  const d = toUtc(dateStr);
  d.setUTCDate(d.getUTCDate() + days);
  return fmt(d);
}

/**
 * 実行時刻 → JST カレンダー日付ラベル。
 * @param {Date|number|string} [now] 省略時は現在時刻
 */
export function jstDateOf(now = Date.now()) {
  const ms =
    now instanceof Date ? now.getTime() : typeof now === "number" ? now : Date.parse(now);
  if (Number.isNaN(ms)) throw new Error(`unparsable now: ${String(now)}`);
  return new Date(ms + JST_OFFSET_MS).toISOString().slice(0, 10);
}

/** 日付ラベル → ISO 週 "YYYY-Www"。 */
export function isoWeekOf(dateStr) {
  const d = toUtc(dateStr);
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(weekNo).padStart(2, "0")}`;
}

/** ISO 週 "YYYY-Www" → その週の月曜・日曜 (日付ラベル)。 */
export function isoWeekRange(week) {
  const m = /^(\d{4})-W(\d{2})$/.exec(String(week));
  if (!m) throw new Error(`invalid ISO week: ${String(week)} (expected YYYY-Www)`);
  const year = Number(m[1]);
  const wk = Number(m[2]);
  if (wk < 1 || wk > 53) throw new Error(`invalid ISO week number: ${week}`);
  // ISO 8601: 1/4 は常に第 1 週に含まれる
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const week1Mon = new Date(jan4);
  week1Mon.setUTCDate(jan4.getUTCDate() - ((jan4.getUTCDay() || 7) - 1));
  const monday = new Date(week1Mon);
  monday.setUTCDate(week1Mon.getUTCDate() + (wk - 1) * 7);
  const sunday = new Date(monday);
  sunday.setUTCDate(monday.getUTCDate() + 6);
  const mondayStr = fmt(monday);
  // 存在しない週 (例 2026-W53) を弾く: 月曜の ISO 週が一致しなければ不正
  if (isoWeekOf(mondayStr) !== `${year}-W${String(wk).padStart(2, "0")}`) {
    throw new Error(`ISO week does not exist: ${week}`);
  }
  return { monday: mondayStr, sunday: fmt(sunday) };
}

/**
 * 週次期間契約の解決。source の取得遅延を織り込み、
 * finalized7d / previous7d / rolling28d を決定的に返す。
 *
 * anchor (期間計算の基準日) の決まり方:
 * 1. `asOf` 指定 → その日付 (week も指定時は週の一致を検証)
 * 2. `week` 指定 → その ISO 週の日曜 (= 週次 cron が走る日)。実行日に依存しない
 * 3. どちらも無し → now (JST) の日付
 *
 * 過去 week backfill の安全性: anchor が now (JST) より未来なら throw
 * (「現在データを過去/未来 week として保存」を構造的に不能にする)。
 *
 * @param {{source:"gsc"|"ga4", week?:string|null, asOf?:string|null, now?:Date|number|string}} p
 */
export function resolvePeriods({ source, week = null, asOf = null, now = Date.now() }) {
  const delayDays = DATA_DELAY_DAYS[source];
  if (delayDays === undefined) {
    throw new Error(`unknown source: ${String(source)} (expected gsc|ga4|adsense)`);
  }
  const today = jstDateOf(now);

  let anchor;
  if (asOf) {
    anchor = fmt(toUtc(asOf));
    if (week && isoWeekOf(anchor) !== week) {
      throw new Error(`asOf ${anchor} is not in week ${week} (isoWeekOf=${isoWeekOf(anchor)})`);
    }
  } else if (week) {
    anchor = isoWeekRange(week).sunday;
  } else {
    anchor = today;
  }
  if (anchor > today) {
    throw new Error(
      `anchor ${anchor} is in the future (today JST = ${today}). ` +
        `week ${week ?? isoWeekOf(anchor)} はまだ確定していない — 過去の週を明示するか日曜以降に実行する`,
    );
  }

  const weekId = week ?? isoWeekOf(anchor);
  const finEnd = addDays(anchor, -delayDays);
  const finStart = addDays(finEnd, -6);
  const prevEnd = addDays(finStart, -1);
  const prevStart = addDays(prevEnd, -6);
  const rollStart = addDays(finEnd, -27);

  return {
    source,
    weekId,
    anchor,
    delayDays,
    finalized7d: { periodStart: finStart, periodEnd: finEnd, windowDays: 7 },
    previous7d: { periodStart: prevStart, periodEnd: prevEnd, windowDays: 7 },
    rolling28d: { periodStart: rollStart, periodEnd: finEnd, windowDays: 28 },
  };
}

/** 施策効果判定の 14/28/56 日スケジュール。baselineEnd は日付ラベル。 */
export function effectWindows(baselineEnd) {
  const base = fmt(toUtc(baselineEnd));
  const out = {};
  for (const days of EFFECT_WINDOW_DAYS) out[`day${days}`] = addDays(base, days);
  return out;
}

/** 期間内の全日付ラベルを列挙する。 */
export function expectedDates({ periodStart, periodEnd }) {
  const out = [];
  let d = fmt(toUtc(periodStart));
  const end = fmt(toUtc(periodEnd));
  if (d > end) throw new Error(`invalid period: ${periodStart} > ${periodEnd}`);
  while (d <= end) {
    out.push(d);
    d = addDays(d, 1);
  }
  return out;
}

/**
 * 日別行の欠損を判定する。欠損日を 0 補完しない。
 * @param {{periodStart:string, periodEnd:string}} period
 * @param {Iterable<string>} presentDates 実在した日付ラベル群
 * @returns {{status:"complete"|"partial"|"missing", missingDates:string[], presentCount:number, expectedCount:number}}
 */
export function assessDailyCoverage(period, presentDates) {
  const present = new Set(presentDates);
  const expected = expectedDates(period);
  const missingDates = expected.filter((d) => !present.has(d));
  const presentCount = expected.length - missingDates.length;
  const status =
    presentCount === 0 ? "missing" : missingDates.length > 0 ? "partial" : "complete";
  return { status, missingDates, presentCount, expectedCount: expected.length };
}

/**
 * summary/snapshot に埋める週次期間契約の共通 metadata。
 * @param {{period:{periodStart:string,periodEnd:string,windowDays:number}, source:string,
 *          isFinalized:boolean, generatedAt:string, limitations?:string[]}} p
 */
export function periodMetadata({ period, source, isFinalized, generatedAt, limitations = [] }) {
  return {
    periodStart: period.periodStart,
    periodEnd: period.periodEnd,
    windowDays: period.windowDays,
    isFinalized,
    generatedAt,
    source,
    limitations,
  };
}
