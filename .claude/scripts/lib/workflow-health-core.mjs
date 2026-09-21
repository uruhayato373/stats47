/**
 * scheduled workflow の健全性判定 (純粋関数)。
 *
 * ★なぜ要るか (2026-08-13)
 * この repo のアラートは **workflow ごとに自前で Issue を立てる**設計なので、
 * アラート自身が壊れると誰も気づけない。実際 sync-rakuten-catalog は
 * `rakuten-alert` ラベル未登録で `gh issue create` が落ち続け、日次同期が
 * 9 日間死んでいたことを 9 日間誰も知らなかった。
 *
 * ここは「個々のアラートが鳴るか」に依存せず、**Actions の run 履歴だけ**から
 * 死んでいる cron を見つける。判定は決定的にし、fetch 層と分離してテストする。
 */

/**
 * workflow の YAML が cron で動くか。
 *
 * ★コメント行の "schedule:" を拾わないよう、**インデント付きの行そのもの**を見る。
 * ここが緩むと対象が水増しされ、逆に厳しすぎると死んだ cron を見落とす。
 */
export function isScheduled(source) {
  return /^\s{2,}schedule:\s*$/m.test(source) && /^\s*-\s*cron:/m.test(source);
}

/** cancelled をタイムアウト (= 失敗) とみなす最小実行時間 (分) */
export const DEFAULT_CANCELLED_FAILURE_MINUTES = 30;
/** 何回連続で失敗したら unhealthy とするか */
export const DEFAULT_MIN_STREAK = 2;

// 初回main反映は2026-09-21 01:40 UTC。全cronへ日次前提を適用しない。
// 同repoで3時間25分のschedule遅延を観測したため、予定時刻から6時間待つ。
// cron時刻との整合は専用テストで固定する。
export const SCHEDULE_CONTRACTS = Object.freeze({
  "authenticated-measurement.yml": Object.freeze({
    firstExpectedAt: "2026-09-21T09:20:00Z",
    intervalHours: 24,
    graceHours: 6,
  }),
});

/** 猶予を過ぎた最新予定枠を返す。createdAtはAPIのcreated_atを正規化した値。 */
export function evaluateSchedule(workflow, runs, nowMs) {
  const contract = SCHEDULE_CONTRACTS[workflow];
  if (!contract || !Number.isFinite(nowMs)) return null;
  const firstMs = Date.parse(contract.firstExpectedAt);
  const intervalMs = contract.intervalHours * 3600000;
  const graceMs = contract.graceHours * 3600000;
  // 猶予を過ぎた最新の予定枠。前回runの遅延分で次回の期限を延ばさない。
  const slot = Math.floor((nowMs - firstMs - graceMs) / intervalMs);
  const expectedMs = firstMs + Math.max(0, slot) * intervalMs;
  const lastRunMs = runs.reduce((latest, run) => {
    if (run.event !== undefined && run.event !== "schedule") return latest;
    const createdMs = Date.parse(run.createdAt ?? "");
    return Number.isFinite(createdMs) && createdMs <= nowMs ? Math.max(latest, createdMs) : latest;
  }, -Infinity);
  return {
    code: slot < 0 || lastRunMs >= expectedMs ? null
      : Number.isFinite(lastRunMs) ? "scheduled_run_stale" : "scheduled_run_missing",
    expectedAt: new Date(expectedMs).toISOString(),
    deadlineAt: new Date(expectedMs + graceMs).toISOString(),
    lastRunAt: Number.isFinite(lastRunMs) ? new Date(lastRunMs).toISOString() : null,
    graceHours: contract.graceHours,
  };
}

/**
 * run 1 件を success / failure / neutral に分類する。
 *
 * ★cancelled の扱いが要点。GitHub は 2 つの別物を同じ `cancelled` で返す:
 *   - job timeout に達して打ち切られた   → **失敗** (ai-content の limit 10 がこれ)
 *   - 後続 push に concurrency で潰された → 無害 (無視する)
 * 実行時間でしか区別できないので、長時間走った cancelled だけ失敗とみなす。
 * neutral は streak を切らない (成功していないので「復旧した」とは言えない)。
 */
export function classifyRun(run, options = {}) {
  const cancelledFailureMinutes =
    options.cancelledFailureMinutes ?? DEFAULT_CANCELLED_FAILURE_MINUTES;
  if (run.conclusion === "success") return "success";
  if (run.conclusion === "failure" || run.conclusion === "timed_out") return "failure";
  if (run.conclusion === "startup_failure") return "failure";
  if (run.conclusion === "cancelled") {
    const minutes = durationMinutes(run);
    if (minutes === null) return "neutral";
    return minutes >= cancelledFailureMinutes ? "failure" : "neutral";
  }
  // skipped / null (in_progress) / action_required など
  return "neutral";
}

function durationMinutes(run) {
  const start = Date.parse(run.runStartedAt ?? run.createdAt ?? "");
  const end = Date.parse(run.updatedAt ?? "");
  if (!Number.isFinite(start) || !Number.isFinite(end) || end < start) return null;
  return (end - start) / 60000;
}

/**
 * 1 workflow の健全性。runs は **新しい順**で渡す。
 * 返り値の failureStreak は「直近から数えた連続失敗数 (neutral は読み飛ばす)」。
 */
export function evaluateWorkflow(workflow, runs, options = {}) {
  const minStreak = options.minStreak ?? DEFAULT_MIN_STREAK;
  const nowMs = options.nowMs ?? null;
  // event省略は既存のschedule専用callerとの互換。明示されたpush/dispatchは除外。
  const scheduledRuns = runs.filter((run) => run.event === undefined || run.event === "schedule");

  let failureStreak = 0;
  let sawSuccess = false;
  let lastSuccessAt = null;
  const recentFailures = [];

  for (const run of scheduledRuns) {
    const verdict = classifyRun(run, options);
    if (verdict === "success") {
      sawSuccess = true;
      lastSuccessAt = run.updatedAt ?? run.createdAt ?? null;
      break;
    }
    if (verdict === "failure") {
      failureStreak += 1;
      if (recentFailures.length < 3) {
        recentFailures.push({ id: run.id ?? null, at: run.createdAt ?? null, conclusion: run.conclusion });
      }
    }
  }

  const daysSinceSuccess =
    lastSuccessAt && nowMs !== null
      ? Math.floor((nowMs - Date.parse(lastSuccessAt)) / 86400000)
      : null;

  // 初回予定・周期が確定したworkflowだけ、未発火/古いrunも検知する。
  const schedule = evaluateSchedule(workflow, scheduledRuns, nowMs);
  const unhealthy = (scheduledRuns.length > 0 && failureStreak >= minStreak) || Boolean(schedule?.code);

  return {
    workflow,
    unhealthy,
    failureStreak,
    lastSuccessAt,
    daysSinceSuccess,
    everSucceeded: sawSuccess,
    recentFailures,
    runsInspected: scheduledRuns.length,
    schedule,
  };
}

/** 全 workflow を評価して unhealthy を新しい順・streak 降順で返す */
export function evaluateAll(entries, options = {}) {
  const results = entries.map(({ workflow, runs }) => evaluateWorkflow(workflow, runs, options));
  const unhealthy = results
    .filter((r) => r.unhealthy)
    .sort((a, b) => b.failureStreak - a.failureStreak || a.workflow.localeCompare(b.workflow));
  return { results, unhealthy, checked: results.length };
}

/** 人間向けの要約 (Issue 本文 / LATEST.md に使う) */
export function formatReport(summary, options = {}) {
  const lines = [];
  lines.push(`scheduled workflow ${summary.checked} 件を検査`);
  if (summary.unhealthy.length === 0) {
    lines.push("連続失敗している cron は無い。監視対象のschedule期限超過も無い。");
    return lines.join("\n");
  }
  lines.push("");
  lines.push(`⚠️ cron 異常 ${summary.unhealthy.length} 件:`);
  for (const r of summary.unhealthy) {
    const age =
      r.daysSinceSuccess === null
        ? r.everSucceeded
          ? "最終成功日時不明"
          : `直近 ${r.runsInspected} 回に成功なし`
        : `最終成功から ${r.daysSinceSuccess} 日`;
    if (r.schedule?.code) {
      lines.push(`- ${r.workflow}: ${r.schedule.code} (予定 ${r.schedule.expectedAt} / 猶予 ${r.schedule.graceHours}時間 / 最終schedule ${r.schedule.lastRunAt ?? "未観測"})`);
    }
    if (r.failureStreak > 0) lines.push(`- ${r.workflow}: ${r.failureStreak} 回連続失敗 (${age})`);
    for (const f of r.recentFailures) {
      const url = f.id && options.repoUrl ? ` ${options.repoUrl}/actions/runs/${f.id}` : "";
      lines.push(`    ${f.at ?? "?"} ${f.conclusion}${url}`);
    }
  }
  return lines.join("\n");
}
