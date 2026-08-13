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

  let failureStreak = 0;
  let sawSuccess = false;
  let lastSuccessAt = null;
  const recentFailures = [];

  for (const run of runs) {
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

  // run が 1 件も無い workflow は「まだ動いていない」だけなので unhealthy にしない。
  // 誤検知を出すゲートは運用で無効化されるので、確実に言える形だけを赤にする。
  const hasRuns = runs.length > 0;
  const unhealthy = hasRuns && failureStreak >= minStreak;

  return {
    workflow,
    unhealthy,
    failureStreak,
    lastSuccessAt,
    daysSinceSuccess,
    everSucceeded: sawSuccess,
    recentFailures,
    runsInspected: runs.length,
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
    lines.push("連続失敗している cron は無い。");
    return lines.join("\n");
  }
  lines.push("");
  lines.push(`⚠️ 連続失敗 ${summary.unhealthy.length} 件:`);
  for (const r of summary.unhealthy) {
    const age =
      r.daysSinceSuccess === null
        ? r.everSucceeded
          ? "最終成功日時不明"
          : `直近 ${r.runsInspected} 回に成功なし`
        : `最終成功から ${r.daysSinceSuccess} 日`;
    lines.push(`- ${r.workflow}: ${r.failureStreak} 回連続失敗 (${age})`);
    for (const f of r.recentFailures) {
      const url = f.id && options.repoUrl ? ` ${options.repoUrl}/actions/runs/${f.id}` : "";
      lines.push(`    ${f.at ?? "?"} ${f.conclusion}${url}`);
    }
  }
  return lines.join("\n");
}
