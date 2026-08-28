/**
 * A8 レポートの要求期間・CSV 実期間・成果利用可否を判定する純関数。
 * ブラウザや fs を持たず、期間不一致と累計値の月次誤配賦を fail-closed にする。
 */

const MONTH_RE = /^(\d{4})-(\d{2})$/;

export function parseRequestedMonth(value) {
  const match = String(value ?? "").match(MONTH_RE);
  if (!match) throw new Error(`--month は YYYY-MM 形式で指定する (受領: ${value ?? ""})`);
  const year = Number(match[1]);
  const month = Number(match[2]);
  if (month < 1 || month > 12) throw new Error(`--month の月が範囲外 (受領: ${value})`);
  return { raw: `${match[1]}-${match[2]}`, year, month, compact: `${match[1]}${match[2]}` };
}

function parseToday(value) {
  const match = String(value ?? "").match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) throw new Error(`today は YYYY-MM-DD 形式で指定する (受領: ${value ?? ""})`);
  return { year: Number(match[1]), month: Number(match[2]), day: Number(match[3]) };
}

const pad2 = (value) => String(value).padStart(2, "0");

/** A8 の管理画面基準である日本時間の日付を返す。UTC 日付のまま当月末を切らない。 */
export function currentJstDate(now = new Date()) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(now);
  const values = Object.fromEntries(parts.map(({ type, value }) => [type, value]));
  return `${values.year}-${values.month}-${values.day}`;
}

export function buildA8PeriodContract({ requestedMonth, kind, today }) {
  const month = parseRequestedMonth(requestedMonth);
  const current = parseToday(today);
  const targetOrder = month.year * 12 + month.month;
  const currentOrder = current.year * 12 + current.month;
  if (targetOrder > currentOrder) throw new Error(`未来月は指定できない (受領: ${requestedMonth}, today: ${today})`);

  if (kind === "month") {
    const value = `${month.year}年${pad2(month.month)}月`;
    return {
      requestedMonth: month.raw,
      kind,
      startValue: value,
      endValue: value,
      expectedPeriod: {
        raw: `${month.compact}-${month.compact}`,
        start: month.raw,
        end: month.raw,
        granularity: "month",
        singleMonth: month.raw,
      },
    };
  }

  if (kind === "day") {
    const lastDay = new Date(Date.UTC(month.year, month.month, 0)).getUTCDate();
    const endDay = targetOrder === currentOrder ? Math.min(current.day, lastDay) : lastDay;
    const startCompact = `${month.compact}01`;
    const endCompact = `${month.compact}${pad2(endDay)}`;
    return {
      requestedMonth: month.raw,
      kind,
      startValue: `${month.year}年${pad2(month.month)}月01日`,
      endValue: `${month.year}年${pad2(month.month)}月${pad2(endDay)}日`,
      expectedPeriod: {
        raw: `${startCompact}-${endCompact}`,
        start: `${month.raw}-01`,
        end: `${month.raw}-${pad2(endDay)}`,
        granularity: "day",
        singleMonth: month.raw,
      },
    };
  }

  throw new Error(`period kind は month/day のみ (受領: ${kind ?? ""})`);
}

export function compareA8Period(contract, actualPeriod) {
  if (!actualPeriod) return { ok: false, reason: "csv-period-missing" };
  if (actualPeriod.raw !== contract.expectedPeriod.raw) {
    return {
      ok: false,
      reason: `csv-period-mismatch(expected=${contract.expectedPeriod.raw},actual=${actualPeriod.raw})`,
    };
  }
  if (actualPeriod.singleMonth !== contract.requestedMonth) {
    return {
      ok: false,
      reason: `csv-single-month-mismatch(expected=${contract.requestedMonth},actual=${actualPeriod.singleMonth ?? "null"})`,
    };
  }
  return { ok: true, reason: null };
}

function ageDays(iso, nowIso) {
  const at = Date.parse(iso ?? "");
  const now = Date.parse(nowIso ?? "");
  if (!Number.isFinite(at) || !Number.isFinite(now)) return null;
  return Math.floor((now - at) / 86400000);
}

/**
 * A8 の成果をポートフォリオ判断へ使えるかを判定する。
 * 欠損・累計・stale・サイト分離不能を 0 実績へ変換せず reasons に残す。
 */
export function evaluateA8OutcomeGate({
  reportLog,
  results,
  nowIso,
  expectedSite,
  maxAgeDays = 35,
}) {
  const reasons = [];
  const reportDays = reportLog ? ageDays(reportLog.updatedAt, nowIso) : null;
  const resultsDays = results ? ageDays(results.updatedAt, nowIso) : null;

  if (!reportLog) reasons.push("a8-report-log-missing");
  if (!results) reasons.push("a8-results-missing");

  const period = reportLog?.period ?? null;
  if (reportLog && !period) reasons.push("a8-period-missing");
  if (period && !period.singleMonth) reasons.push("a8-period-not-single-month");
  if (reportLog && reportDays == null) reasons.push("a8-report-log-timestamp-missing");
  else if (reportDays > maxAgeDays) reasons.push(`a8-report-log-stale(${reportDays}d)`);
  if (results && resultsDays == null) reasons.push("a8-results-timestamp-missing");
  else if (resultsDays > maxAgeDays) reasons.push(`a8-results-stale(${resultsDays}d)`);

  if (reportLog && expectedSite && reportLog.site !== expectedSite) {
    reasons.push(`a8-site-mismatch(expected=${expectedSite},actual=${reportLog.site ?? "null"})`);
  }

  if (period?.raw) {
    const siteRow = (reportLog?.siteSummary ?? []).find(
      (row) => row.period === period.raw && (!expectedSite || String(row.site ?? "").includes(expectedSite)),
    );
    if (!siteRow) reasons.push("a8-site-summary-missing-for-period");
  }

  if (reportLog?.crossCheck?.comparable !== true) reasons.push("a8-cross-check-unavailable");
  else {
    if (reportLog.crossCheck.exceeded) reasons.push("a8-cross-check-exceeded");
    if (reportLog.crossCheck.hasShortfall) reasons.push("a8-cross-check-shortfall");
  }

  if (results) {
    if (!Array.isArray(results.records)) reasons.push("a8-results-records-invalid");
    else if (period?.singleMonth && !results.records.some((row) => row.month === period.singleMonth)) {
      reasons.push("a8-results-month-missing");
    }
  }

  return {
    status: reasons.length === 0 ? "ready" : "blocked",
    reasons,
    period: period
      ? { raw: period.raw ?? null, singleMonth: period.singleMonth ?? null }
      : null,
    freshness: { reportDays, resultsDays, maxAgeDays },
  };
}
