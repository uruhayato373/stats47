/**
 * A8 成果期間の決定的コア。
 *
 * ブラウザ操作やファイル I/O は持たない。`--probe-period` の観察結果、要求月と
 * CSV ファイル名から解析した実期間、成果 SSOT の鮮度を fixture で検証する。
 */

export const A8_OUTCOME_STALE_DAYS = 30;

const MS_PER_DAY = 24 * 60 * 60 * 1000;

function daysBetween(fromIso, toIso) {
  const from = Date.parse(fromIso);
  const to = Date.parse(toIso);
  if (Number.isNaN(from) || Number.isNaN(to)) return null;
  return Math.floor((to - from) / MS_PER_DAY);
}

export function formatA8Month(month) {
  const matched = /^(\d{4})-(\d{2})$/.exec(String(month ?? ""));
  if (!matched) throw new Error(`month は YYYY-MM 形式で指定してください（受領: ${month}）`);
  const monthNumber = Number(matched[2]);
  if (monthNumber < 1 || monthNumber > 12) throw new Error(`月が範囲外です: ${month}`);
  return `${matched[1]}年${matched[2]}月`;
}

/**
 * probe が config の placeholder で月レンジを一意に選べるかを検証する。
 * `name=start/end` は月・日レンジで重複するため selector に使わない。
 */
export function validatePeriodFormProbe(probe, periodForm) {
  const reasons = [];
  const fields = Array.isArray(probe?.fields) ? probe.fields : [];
  const buttons = Array.isArray(probe?.buttons) ? probe.buttons : [];

  if (!periodForm) {
    return { status: "blocked", reasons: ["a8-period-form-config-missing"], selectors: null };
  }

  const countVisible = (placeholder) =>
    fields.filter((field) => field.placeholder === placeholder && field.visible === true).length;
  const startCount = countVisible(periodForm.startPlaceholder);
  const endCount = countVisible(periodForm.endPlaceholder);
  const applyCount = buttons.filter(
    (button) => button.visible === true && button.text === periodForm.applyButtonLabel,
  ).length;

  if (startCount !== 1) reasons.push(`a8-period-start-not-unique(${startCount})`);
  if (endCount !== 1) reasons.push(`a8-period-end-not-unique(${endCount})`);
  if (applyCount !== 1) reasons.push(`a8-period-apply-not-unique(${applyCount})`);

  return {
    status: reasons.length === 0 ? "ready" : "blocked",
    reasons,
    selectors: {
      start: `input[placeholder="${periodForm.startPlaceholder}"]:visible`,
      end: `input[placeholder="${periodForm.endPlaceholder}"]:visible`,
      applyButtonLabel: periodForm.applyButtonLabel,
    },
  };
}

/** 要求した単月と CSV ファイル名から得た実期間を照合する。 */
export function verifyRequestedPeriod({ requestedMonth, actualPeriod }) {
  if (!requestedMonth) {
    return { status: "blocked", reasons: ["a8-requested-month-missing"] };
  }

  try {
    formatA8Month(requestedMonth);
  } catch {
    return { status: "blocked", reasons: [`a8-requested-month-invalid(${requestedMonth})`] };
  }

  if (!actualPeriod) return { status: "blocked", reasons: ["a8-csv-period-missing"] };
  if (!actualPeriod.singleMonth) {
    return {
      status: "blocked",
      reasons: [`a8-csv-period-not-single-month(${actualPeriod.raw ?? "unknown"})`],
    };
  }
  if (actualPeriod.singleMonth !== requestedMonth) {
    return {
      status: "blocked",
      reasons: [`a8-csv-period-mismatch(${requestedMonth}!=${actualPeriod.singleMonth})`],
    };
  }
  return { status: "ready", reasons: [] };
}

/**
 * 成果指標を実験判断へ使えるかを判定する。
 * 欠損や累計期間を 0 件・当月実績へ丸めず、blocked 理由として保持する。
 */
export function evaluateOutcomeGate({
  results,
  reportLog,
  nowIso,
  staleDays = A8_OUTCOME_STALE_DAYS,
}) {
  const reasons = [];
  const resultDays = results?.updatedAt ? daysBetween(results.updatedAt, nowIso) : null;
  const reportDays = reportLog?.updatedAt ? daysBetween(reportLog.updatedAt, nowIso) : null;

  if (!results) reasons.push("a8-results-missing");
  if (!reportLog) reasons.push("a8-report-log-missing");

  if (results) {
    if (!Array.isArray(results.records) || results.records.length === 0) reasons.push("a8-results-empty");
    if (resultDays == null || resultDays > staleDays) {
      reasons.push(`a8-results-stale(${resultDays ?? "?"}d>${staleDays}d)`);
    }
  }

  if (reportLog) {
    if (reportDays == null || reportDays > staleDays) {
      reasons.push(`a8-report-log-stale(${reportDays ?? "?"}d>${staleDays}d)`);
    }
    const period = reportLog.period;
    if (!period) reasons.push("a8-report-period-missing");
    else if (!period.singleMonth) {
      reasons.push(`a8-report-period-not-single-month(${period.raw ?? "unknown"})`);
    } else if (!(results?.records ?? []).some((record) => record.month === period.singleMonth)) {
      reasons.push(`a8-results-month-missing(${period.singleMonth})`);
    }
  }

  return {
    status: reasons.length === 0 ? "ready" : "blocked",
    reasons,
    freshness: { resultDays, reportDays },
  };
}
