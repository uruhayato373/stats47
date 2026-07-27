/**
 * weekly-summary — GSC/GA4 の確定7日 KPI とローリング28日 summary を組み立てる純粋関数群。
 *
 * 正典: docs/02_実装計画/39_検索成長統合MCP・API基盤実装仕様.md §18.2。
 * 期間の解決は periods.mjs (SSOT)。ここは集計・組み立て・履歴 schema 移行・LATEST 描画のみ。
 *
 * 契約:
 * - KPI / WoW は finalized7d と直前の重複しない previous7d だけ。coverage が partial/missing
 *   のときは wow=null + wowBlockedReason を返し、消費側は insufficient-data として扱う。
 * - rolling28d は機会発見用。前回 snapshot との差を WoW と呼ばない (renderer は前週比を出さない)。
 * - 欠損日を 0 補完しない (assessDailyCoverage の結果をそのまま保持する)。
 *
 * テスト: .claude/scripts/metrics/__tests__/weekly-summary.test.mjs
 */

import { resolvePeriods, assessDailyCoverage, periodMetadata } from "./periods.mjs";

export const SUMMARY_SCHEMA_VERSION = 2;
export const SUMMARY_FILE = "summary.json";

const round = (v, digits) => (v === null ? null : Number(v.toFixed(digits)));
const num = (v) => {
  if (v === undefined || v === null || v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

// ── GSC 集計 ─────────────────────────────────────────────────────────

/**
 * GSC 日別行を期間で集計する。欠損日は 0 補完せず coverage に記録する。
 * @param {Array<{date:string, clicks:any, impressions:any, position:any}>} dailyRows
 * @param {{periodStart:string, periodEnd:string}} period
 */
export function aggregateGscDaily(dailyRows, period) {
  const inPeriod = dailyRows.filter(
    (r) => r.date >= period.periodStart && r.date <= period.periodEnd,
  );
  const coverage = assessDailyCoverage(period, inPeriod.map((r) => r.date));
  if (coverage.status === "missing") {
    return { clicks: null, impressions: null, ctr: null, position: null, coverage };
  }
  let clicks = 0;
  let imps = 0;
  let posWeighted = 0;
  for (const r of inPeriod) {
    const c = num(r.clicks) ?? 0;
    const i = num(r.impressions) ?? 0;
    clicks += c;
    imps += i;
    posWeighted += (num(r.position) ?? 0) * i;
  }
  return {
    clicks,
    impressions: imps,
    ctr: imps > 0 ? round(clicks / imps, 4) : null,
    position: imps > 0 ? round(posWeighted / imps, 2) : null,
    coverage,
  };
}

/** 2 期間 KPI の WoW (差分 + %)。キーごとに null 安全。 */
export function computeWow(cur, prev, keys) {
  const out = {};
  for (const k of keys) {
    const c = num(cur?.[k]);
    const p = num(prev?.[k]);
    if (c === null || p === null) {
      out[k] = { delta: null, pct: null };
      continue;
    }
    const delta = round(c - p, 4);
    out[k] = { delta, pct: p !== 0 ? round(((c - p) / p) * 100, 1) : null };
  }
  return out;
}

/**
 * GSC 週次 summary (確定7日 KPI + 直前7日 + ローリング28日)。
 * dailyRows は rolling28d 全域の日別行 (previous7d〜finalized7d を内包する)。
 */
export function buildGscSummary({ week = null, asOf = null, now = Date.now(), dailyRows, generatedAt = new Date().toISOString() }) {
  const periods = resolvePeriods({ source: "gsc", week, asOf, now });
  const fin = aggregateGscDaily(dailyRows, periods.finalized7d);
  const prev = aggregateGscDaily(dailyRows, periods.previous7d);
  const roll = aggregateGscDaily(dailyRows, periods.rolling28d);

  const kpiComplete = fin.coverage.status === "complete" && prev.coverage.status === "complete";
  const wow = kpiComplete ? computeWow(fin, prev, ["clicks", "impressions", "ctr", "position"]) : null;
  const wowBlockedReason = kpiComplete
    ? null
    : `insufficient-data: finalized7d=${fin.coverage.status} (missing ${fin.coverage.missingDates.join(",") || "-"}) / previous7d=${prev.coverage.status} (missing ${prev.coverage.missingDates.join(",") || "-"})`;

  const baseLimitations = [
    `取得遅延 ${periods.delayDays} 日を考慮 (anchor=${periods.anchor})`,
    "position は日別 impressions 加重平均 (GSC API の期間集計と ±0.01 程度ずれうる)",
  ];
  return {
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    source: "gsc",
    weekId: periods.weekId,
    anchor: periods.anchor,
    delayDays: periods.delayDays,
    generatedAt,
    finalized7d: {
      ...periodMetadata({ period: periods.finalized7d, source: "gsc", isFinalized: true, generatedAt, limitations: baseLimitations }),
      kpis: { clicks: fin.clicks, impressions: fin.impressions, ctr: fin.ctr, position: fin.position },
      coverage: fin.coverage,
    },
    previous7d: {
      ...periodMetadata({ period: periods.previous7d, source: "gsc", isFinalized: true, generatedAt, limitations: baseLimitations }),
      kpis: { clicks: prev.clicks, impressions: prev.impressions, ctr: prev.ctr, position: prev.position },
      coverage: prev.coverage,
    },
    rolling28d: {
      ...periodMetadata({
        period: periods.rolling28d,
        source: "gsc",
        isFinalized: true,
        generatedAt,
        limitations: [...baseLimitations, "機会発見用。前回 snapshot と 21 日重複するため WoW 比較禁止 (§18.2)"],
      }),
      kpis: { clicks: roll.clicks, impressions: roll.impressions, ctr: roll.ctr, position: roll.position },
      coverage: roll.coverage,
    },
    wow,
    wowBlockedReason,
  };
}

// ── GA4 集計 ─────────────────────────────────────────────────────────

/**
 * GA4 週次 summary (Japan-only clean の確定7日 + 直前7日 + raw pollution)。
 *
 * activeUsers は期間内 user dedup のため日別合算できない — 期間 totals は API から渡す。
 * dailyCleanRows は coverage (欠損日) 判定にのみ使う。
 *
 * @param {{week?:string|null, asOf?:string|null, now?:any,
 *   finalizedTotals:object|null, previousTotals:object|null,
 *   dailyCleanRows:Array<{date:string}>, rawFinalizedTotals?:object|null,
 *   generatedAt?:string}} p
 */
export function buildGa4Summary({
  week = null,
  asOf = null,
  now = Date.now(),
  finalizedTotals,
  previousTotals,
  dailyCleanRows,
  rawFinalizedTotals = null,
  generatedAt = new Date().toISOString(),
}) {
  const periods = resolvePeriods({ source: "ga4", week, asOf, now });
  const finCoverage = assessDailyCoverage(periods.finalized7d, dailyCleanRows.map((r) => r.date));
  const prevCoverage = assessDailyCoverage(periods.previous7d, dailyCleanRows.map((r) => r.date));

  const toKpis = (t) =>
    t === null
      ? null
      : {
          activeUsers: num(t.activeUsers),
          sessions: num(t.sessions),
          engagedSessions: num(t.engagedSessions),
          pageviews: num(t.screenPageViews ?? t.pageviews),
          engagementRate:
            num(t.engagementRate) ?? (num(t.engagedSessions) !== null && num(t.sessions) ? round(num(t.engagedSessions) / num(t.sessions), 4) : null),
        };
  const fin = toKpis(finalizedTotals);
  const prev = toKpis(previousTotals);

  const kpiComplete =
    fin !== null && prev !== null && finCoverage.status === "complete" && prevCoverage.status === "complete";
  const wow = kpiComplete
    ? computeWow(fin, prev, ["activeUsers", "sessions", "engagedSessions", "pageviews", "engagementRate"])
    : null;
  const wowBlockedReason = kpiComplete
    ? null
    : fin === null || prev === null
      ? "insufficient-data: Japan-only totals 未取得"
      : `insufficient-data: finalized7d=${finCoverage.status} (missing ${finCoverage.missingDates.join(",") || "-"}) / previous7d=${prevCoverage.status} (missing ${prevCoverage.missingDates.join(",") || "-"})`;

  const limitations = [
    `取得遅延 ${periods.delayDays} 日を考慮 (anchor=${periods.anchor})`,
    "KPI は country=Japan の clean slice。raw (無フィルタ) は pollution 監視専用で KPI へ混ぜない (§18.2)",
    "activeUsers は期間内 user dedup 値 (日別行の合算ではない)",
  ];

  const rawSessions = num(rawFinalizedTotals?.sessions);
  const jpSessions = fin?.sessions ?? null;
  const pollution =
    rawSessions !== null && jpSessions !== null
      ? {
          ...periodMetadata({ period: periods.finalized7d, source: "ga4", isFinalized: true, generatedAt, limitations: ["raw (無フィルタ) − Japan-only の残余 = overseas/(not set) 汚染量の推定"] }),
          rawSessions,
          jpSessions,
          pollutedSessions: round(rawSessions - jpSessions, 0),
          pollutedPct: rawSessions > 0 ? round(((rawSessions - jpSessions) / rawSessions) * 100, 1) : null,
        }
      : null;

  return {
    schemaVersion: SUMMARY_SCHEMA_VERSION,
    source: "ga4",
    weekId: periods.weekId,
    anchor: periods.anchor,
    delayDays: periods.delayDays,
    generatedAt,
    jpFinalized7d: {
      ...periodMetadata({ period: periods.finalized7d, source: "ga4", isFinalized: true, generatedAt, limitations }),
      kpis: fin,
      coverage: finCoverage,
    },
    jpPrevious7d: {
      ...periodMetadata({ period: periods.previous7d, source: "ga4", isFinalized: true, generatedAt, limitations }),
      kpis: prev,
      coverage: prevCoverage,
    },
    pollution,
    wow,
    wowBlockedReason,
  };
}

// ── history.csv schema v2 (列名で期間種別を明記・§18.2) ───────────────

/** GSC history.csv v2: 既存 28 日合計行の意味を列名で明記 (値は不変)。 */
export const GSC_HISTORY_FIELDS_V2 = Object.freeze([
  "week",
  "clicks_rolling28d",
  "impressions_rolling28d",
  "ctr_rolling28d",
  "position_rolling28d",
  "rows_queries",
  "rows_pages",
]);

const GSC_HISTORY_RENAME = Object.freeze({
  clicks: "clicks_rolling28d",
  impressions: "impressions_rolling28d",
  ctr: "ctr_rolling28d",
  position: "position_rolling28d",
});

/**
 * GSC history 行を v2 列名へ移行する (値は保全・列名のみ)。既に v2 ならそのまま。
 * @returns {{rows:object[], migrated:boolean}}
 */
export function migrateGscHistoryRows(rows) {
  let migrated = false;
  const out = rows.map((r) => {
    if (r.clicks_rolling28d !== undefined) return r;
    if (r.clicks === undefined) return r;
    migrated = true;
    const o = { week: r.week };
    for (const [from, to] of Object.entries(GSC_HISTORY_RENAME)) o[to] = r[from];
    o.rows_queries = r.rows_queries;
    o.rows_pages = r.rows_pages;
    return o;
  });
  return { rows: out, migrated };
}

/** GA4 history.csv v2: 行ごとの集計基盤を basis 列で明記 (値は不変)。 */
export const GA4_HISTORY_FIELDS_V2 = Object.freeze([
  "week",
  "basis",
  "active_users",
  "new_users",
  "sessions",
  "pageviews",
  "avg_session_duration_sec",
  "bounce_rate",
]);

/**
 * GA4 history 行へ basis 列を付与する (値は保全)。
 * basis: "jp-calendar-week" (overview-clean 由来) | "raw-rolling28d" (旧 raw overview 由来)。
 * @param {object[]} rows
 * @param {(week:string)=>boolean} weekHasCleanSnapshot 該当週 snapshot に overview-clean.csv があるか
 */
export function migrateGa4HistoryRows(rows, weekHasCleanSnapshot) {
  let migrated = false;
  const out = rows.map((r) => {
    if (r.basis !== undefined && r.basis !== "") return r;
    migrated = true;
    return { ...r, basis: weekHasCleanSnapshot(r.week) ? "jp-calendar-week" : "raw-rolling28d" };
  });
  return { rows: out, migrated };
}

// ── 確定7日 履歴 (新契約・非重複系列) ────────────────────────────────

export const GSC_FINALIZED_HISTORY_FIELDS = Object.freeze([
  "week",
  "period_start",
  "period_end",
  "clicks_finalized7d",
  "impressions_finalized7d",
  "ctr_finalized7d",
  "position_finalized7d",
  "missing_days",
]);

export const GA4_FINALIZED_HISTORY_FIELDS = Object.freeze([
  "week",
  "period_start",
  "period_end",
  "active_users_jp7d",
  "sessions_jp7d",
  "engaged_sessions_jp7d",
  "pageviews_jp7d",
  "engagement_rate_jp7d",
  "missing_days",
]);

/** GSC summary → 確定7日履歴の 1 行。coverage が complete でなければ null (partial を KPI 化しない)。 */
export function gscFinalizedHistoryRow(summary) {
  const f = summary?.finalized7d;
  if (!f || f.coverage?.status !== "complete") return null;
  return {
    week: summary.weekId,
    period_start: f.periodStart,
    period_end: f.periodEnd,
    clicks_finalized7d: f.kpis.clicks,
    impressions_finalized7d: f.kpis.impressions,
    ctr_finalized7d: f.kpis.ctr,
    position_finalized7d: f.kpis.position,
    missing_days: 0,
  };
}

/** GA4 summary → 確定7日履歴の 1 行。 */
export function ga4FinalizedHistoryRow(summary) {
  const f = summary?.jpFinalized7d;
  if (!f || f.kpis === null || f.coverage?.status !== "complete") return null;
  return {
    week: summary.weekId,
    period_start: f.periodStart,
    period_end: f.periodEnd,
    active_users_jp7d: f.kpis.activeUsers,
    sessions_jp7d: f.kpis.sessions,
    engaged_sessions_jp7d: f.kpis.engagedSessions,
    pageviews_jp7d: f.kpis.pageviews,
    engagement_rate_jp7d: f.kpis.engagementRate,
    missing_days: 0,
  };
}

// ── LATEST.md renderer (確定7日 KPI + ローリング28日・WoW 分離) ──────

const pctStr = (v) => (v === null || v === undefined ? "-" : `${(Number(v) * 100).toFixed(2)}%`);
const deltaStr = (w) => {
  if (!w || w.delta === null) return "-";
  const sign = w.delta > 0 ? "+" : "";
  const pct = w.pct !== null && w.pct !== undefined ? ` (${sign}${w.pct}%)` : "";
  return `${sign}${w.delta}${pct}`;
};

/**
 * GSC LATEST.md を描画する。
 * @param {{summary:object|null, rollingRows:object[], week:string}} p
 *   rollingRows は v2 列名の history.csv 行 (末尾が最新)。
 */
export function renderGscLatest({ summary, rollingRows, week }) {
  const lines = [];
  lines.push(`# GSC Latest — ${week}`);
  lines.push("");
  lines.push("## 確定7日 KPI (finalized7d — WoW・フェーズゲートはここだけ)");
  lines.push("");
  if (summary && summary.wow) {
    const f = summary.finalized7d;
    const p = summary.previous7d;
    lines.push(`期間: ${f.periodStart} 〜 ${f.periodEnd}（直前7日: ${p.periodStart} 〜 ${p.periodEnd}・重複なし）`);
    lines.push("");
    lines.push("| Metric | 確定7日 | 直前7日 | WoW |");
    lines.push("|---|---|---|---|");
    lines.push(`| Clicks | ${f.kpis.clicks} | ${p.kpis.clicks} | ${deltaStr(summary.wow.clicks)} |`);
    lines.push(`| Impressions | ${f.kpis.impressions} | ${p.kpis.impressions} | ${deltaStr(summary.wow.impressions)} |`);
    lines.push(`| CTR | ${pctStr(f.kpis.ctr)} | ${pctStr(p.kpis.ctr)} | |`);
    lines.push(`| Avg Position | ${f.kpis.position} | ${p.kpis.position} | |`);
  } else if (summary) {
    lines.push(`⚠️ insufficient-data — ${summary.wowBlockedReason ?? "KPI 期間の日別行が欠損"}。WoW・ゲート判定は停止する。`);
  } else {
    lines.push("⚠️ 確定7日 summary が未生成 (summary.json 無し・daily.csv から再計算不能)。WoW・ゲート判定は停止する。");
  }
  lines.push("");
  lines.push("## ローリング28日 (rolling28d — 機会発見用。前週比を出さない)");
  lines.push("");
  const latest = rollingRows.length ? rollingRows[rollingRows.length - 1] : null;
  if (latest) {
    lines.push("| Metric | ローリング28日 |");
    lines.push("|---|---|");
    lines.push(`| Clicks | ${latest.clicks_rolling28d} |`);
    lines.push(`| Impressions | ${latest.impressions_rolling28d} |`);
    lines.push(`| CTR | ${pctStr(latest.ctr_rolling28d)} |`);
    lines.push(`| Avg Position | ${Number(latest.position_rolling28d).toFixed(2)} |`);
    lines.push(`| Queries rows | ${latest.rows_queries} |`);
    lines.push(`| Pages rows | ${latest.rows_pages} |`);
    lines.push("");
    lines.push("> 28日窓は前回 snapshot と 21 日重複する。この表の週次差分を WoW と呼ばない (§18.2)。");
  } else {
    lines.push("_rolling28d 履歴なし_");
  }
  lines.push("");
  lines.push("履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / ローリング28日 = [`history.csv`](./history.csv)");
  lines.push("");
  lines.push("> schema v2 (2026-07-28): 旧 `history.csv` の clicks/impressions/ctr/position は当初から");
  lines.push("> ローリング28日合計だったため、列名を `*_rolling28d` に改名した (値は不変)。旧 LATEST の");
  lines.push("> 「今週」「前週比」表示は 21 日重複の rolling 差であり WoW ではない。KPI は本ファイル上段の確定7日を使う。");
  lines.push("");
  return lines.join("\n");
}

/** GA4 LATEST.md を描画する。 */
export function renderGa4Latest({ summary, legacyRows, week }) {
  const lines = [];
  lines.push(`# GA4 Latest — ${week}`);
  lines.push("");
  lines.push("## 確定7日 KPI (jpFinalized7d — Japan-only clean。WoW はここだけ)");
  lines.push("");
  if (summary && summary.wow) {
    const f = summary.jpFinalized7d;
    const p = summary.jpPrevious7d;
    lines.push(`期間: ${f.periodStart} 〜 ${f.periodEnd}（直前7日: ${p.periodStart} 〜 ${p.periodEnd}・重複なし）`);
    lines.push("");
    lines.push("| Metric | 確定7日 | 直前7日 | WoW |");
    lines.push("|---|---|---|---|");
    lines.push(`| Active Users | ${f.kpis.activeUsers} | ${p.kpis.activeUsers} | ${deltaStr(summary.wow.activeUsers)} |`);
    lines.push(`| Sessions | ${f.kpis.sessions} | ${p.kpis.sessions} | ${deltaStr(summary.wow.sessions)} |`);
    lines.push(`| Engaged Sessions | ${f.kpis.engagedSessions} | ${p.kpis.engagedSessions} | ${deltaStr(summary.wow.engagedSessions)} |`);
    lines.push(`| Pageviews | ${f.kpis.pageviews} | ${p.kpis.pageviews} | ${deltaStr(summary.wow.pageviews)} |`);
    lines.push(`| Engagement Rate | ${pctStr(f.kpis.engagementRate)} | ${pctStr(p.kpis.engagementRate)} | |`);
    if (summary.pollution) {
      lines.push("");
      lines.push(`> pollution 監視: raw sessions ${summary.pollution.rawSessions} − JP ${summary.pollution.jpSessions} = ${summary.pollution.pollutedSessions} (${summary.pollution.pollutedPct ?? "-"}%)。raw を KPI へ混ぜない。`);
    }
  } else if (summary) {
    lines.push(`⚠️ insufficient-data — ${summary.wowBlockedReason ?? "KPI 期間の日別行が欠損"}。WoW・ゲート判定は停止する。`);
  } else {
    lines.push("⚠️ 確定7日 summary が未生成 (summary.json 無し)。WoW・ゲート判定は停止する。");
  }
  lines.push("");
  lines.push("## 参考系列 (legacy history — 基盤混在のため週次ゲートに使わない)");
  lines.push("");
  const latest = legacyRows.length ? legacyRows[legacyRows.length - 1] : null;
  if (latest) {
    lines.push("| Metric | 値 | basis |");
    lines.push("|---|---|---|");
    lines.push(`| Active Users | ${latest.active_users} | ${latest.basis} |`);
    lines.push(`| Sessions | ${latest.sessions} | ${latest.basis} |`);
    lines.push(`| Pageviews | ${latest.pageviews} | ${latest.basis} |`);
    lines.push("");
    lines.push("> basis=jp-calendar-week は Japan-only カレンダー週 (日曜実行時は末日未確定)、");
    lines.push("> basis=raw-rolling28d は無フィルタ 28 日合計 (overseas/(not set) 汚染あり)。KPI は上段の確定7日を使う。");
  } else {
    lines.push("_legacy 履歴なし_");
  }
  lines.push("");
  lines.push("履歴: 確定7日 = [`history-finalized7d.csv`](./history-finalized7d.csv) / legacy = [`history.csv`](./history.csv)");
  lines.push("");
  lines.push("> schema v2 (2026-07-28): 旧 `history.csv` は W22 以前が raw 28 日合計、W23 以降が Japan-only");
  lines.push("> カレンダー週と基盤が混在していたため `basis` 列で行ごとに明記した (値は不変)。");
  lines.push("");
  return lines.join("\n");
}
