/**
 * 計測→記録→改善サイクルの週次状態 (pure)。
 *
 * 週次 snapshot (GA4 journey slice) と GA4 custom dimension の登録状況、改善バックログを突き合わせ、
 * 週次メトリクス Issue / weekly-review / CI の improvement-triage run が同じ事実を読むための 1 つの state にする。
 * 欠けた入力は 0 に丸めず status で区別する (evidence-based-judgment)。
 */
import { reconcileDimensions } from "../../google-admin/dimension-ledger.mjs";

/** 登録すれば値別の内訳を読める最低発火量 (28 日)。これ未満は登録しても判定の標本にならない。 */
export const MIN_EVENTS_FOR_BREAKDOWN = 100;
/** 業務文脈の着地として一覧に出す最低セッション (28 日)。landing-context.csv 自体の下限 10 より厳しくする。 */
export const WORK_CONTEXT_MIN_SESSIONS = 25;
export const WORK_CONTEXT_TOP = 8;
export const TOP_TRANSITIONS = 8;

/** RFC 4180 の最小実装 (quoted field 内の , と "" に対応)。 */
export function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const src = String(text ?? "");
  for (let i = 0; i < src.length; i++) {
    const c = src[i];
    if (quoted) {
      if (c === '"' && src[i + 1] === '"') { field += '"'; i++; }
      else if (c === '"') quoted = false;
      else field += c;
    } else if (c === '"') quoted = true;
    else if (c === ",") { row.push(field); field = ""; }
    else if (c === "\n") { row.push(field); rows.push(row); row = []; field = ""; }
    else if (c !== "\r") field += c;
  }
  if (field !== "" || row.length) { row.push(field); rows.push(row); }
  const [header, ...body] = rows.filter((r) => !(r.length === 1 && r[0] === ""));
  if (!header) return [];
  return body.map((r) => Object.fromEntries(header.map((h, i) => [h, r[i] ?? ""])));
}

const sum = (rows, pick) => rows.reduce((total, row) => total + Number(pick(row) || 0), 0);
const ratio = (part, whole) => (whole > 0 ? Number((part / whole).toFixed(4)) : null);

export function summarizeJourney({ transitions, pagesClean }) {
  const pv = (from, to) => sum(transitions.filter((r) => r.from_section === from && r.to_section === to), (r) => r.pageViews);
  const sectionPv = (prefix) => sum(pagesClean.filter((r) => String(r.pagePath).startsWith(prefix)), (r) => r.screenPageViews);
  const blogPageViews = sectionPv("/blog/");
  const themePageViews = sectionPv("/themes/");
  const blogToRanking = pv("blog", "ranking");
  const themesToRanking = pv("themes", "ranking");
  const themesToBlog = pv("themes", "blog");
  return {
    blogToRanking: { pageViews: blogToRanking, fromPageViews: blogPageViews, rate: ratio(blogToRanking, blogPageViews) },
    themesToRanking: { pageViews: themesToRanking, fromPageViews: themePageViews, rate: ratio(themesToRanking, themePageViews) },
    themesToBlog: { pageViews: themesToBlog, fromPageViews: themePageViews, rate: ratio(themesToBlog, themePageViews) },
    topCrossSection: transitions
      .filter((r) => r.from_section !== r.to_section)
      .map((r) => ({ from: r.from_section, to: r.to_section, pageViews: Number(r.pageViews) }))
      .sort((a, b) => b.pageViews - a.pageViews)
      .slice(0, TOP_TRANSITIONS),
  };
}

export function summarizeWorkContext(landingRows) {
  const rows = landingRows
    .filter((r) => r.landingPage && r.landingPage !== "(not set)")
    .map((r) => ({
      landingPage: r.landingPage,
      sessions: Number(r.sessions),
      desktopShare: Number(r.desktopShare),
      workdayHoursShare: Number(r.workdayHoursShare),
      avgEngagementSec: Number(r.avgEngagementSec),
    }));
  const sessions = sum(rows, (r) => r.sessions);
  const weighted = (key) => (sessions > 0 ? Number((sum(rows, (r) => r[key] * r.sessions) / sessions).toFixed(3)) : null);
  const baseline = { sessions, desktopShare: weighted("desktopShare"), workdayHoursShare: weighted("workdayHoursShare") };
  const top = rows
    .filter((r) => r.sessions >= WORK_CONTEXT_MIN_SESSIONS
      && r.desktopShare > baseline.desktopShare && r.workdayHoursShare > baseline.workdayHoursShare)
    .sort((a, b) => b.sessions * b.desktopShare * b.workdayHoursShare - a.sessions * a.desktopShare * a.workdayHoursShare)
    .slice(0, WORK_CONTEXT_TOP);
  return { baseline, top };
}

/** 台帳上「登録が要るのに GA4 に無い」パラメータを、イベントの発火量つきでまとめる。 */
export function summarizeDimensionGaps({ ledgerEntries, registeredParams, eventVolume }) {
  const { rows } = reconcileDimensions(ledgerEntries, registeredParams);
  const absent = rows.filter((r) => !r.present);
  const counts = new Map(eventVolume.map((r) => [r.eventName, Number(r.eventCount)]));
  const byEvent = new Map();
  for (const row of absent) {
    const key = row.events.join(" / ");
    const entry = byEvent.get(key) ?? { events: row.events, params: [], eventCount28d: sum(row.events.map((e) => ({ v: counts.get(e) ?? 0 })), (x) => x.v) };
    if (!entry.params.includes(row.param)) entry.params.push(row.param);
    byEvent.set(key, entry);
  }
  const groups = [...byEvent.values()]
    .map((g) => ({ ...g, breakdownReady: g.eventCount28d >= MIN_EVENTS_FOR_BREAKDOWN }))
    .sort((a, b) => b.eventCount28d - a.eventCount28d);
  return { absentParams: new Set(absent.map((r) => r.param)).size, groups };
}

/** effect/pending を含む active 施策のうち、期日が asOf より前のもの。 */
export function summarizeOverdue(entries, asOf) {
  const overdue = entries
    .filter((e) => e.due && e.due < asOf)
    .map((e) => ({ id: e.section_id, status: e.status, due: e.due, metric: e.target_metric ?? e.metric, owner: e.owner }))
    .sort((a, b) => a.due.localeCompare(b.due) || a.id.localeCompare(b.id));
  return { active: entries.length, overdue };
}

/**
 * 閾値エンジンの今週の判定と、GSC 施策が機械判定に必要な目印を持っているか。
 * @param {{ verdicts: object|null, gscRows: Array<{id:string, hasPage:boolean, hasDeploy:boolean, hasTarget:boolean}> }} input
 */
export function summarizeEngine({ verdicts, gscRows }) {
  const byDomain = {};
  for (const v of verdicts?.verdicts ?? []) {
    const d = (byDomain[v.domainId] ??= { subjects: 0, byLabel: {} });
    d.subjects += 1;
    d.byLabel[v.label] = (d.byLabel[v.label] ?? 0) + 1;
  }
  const missing = gscRows
    .map((r) => ({
      id: r.id,
      missing: [!r.hasPage && "[gsc-page: /path]", !r.hasDeploy && "デプロイ済 YYYY-MM-DD", !r.hasTarget && "[target: +N clicks]"].filter(Boolean),
    }))
    .filter((r) => r.missing.length > 0);
  return {
    verdictsWeek: verdicts?.week ?? null,
    byDomain,
    gsc: { active: gscRows.length, judgeable: gscRows.length - missing.length, missing },
  };
}

/** 運用系 source の週窓 (asOf を含む直近 7 日) と、最新観測がこれより古ければ stale とする日数。 */
export const OPS_WINDOW_DAYS = 7;
export const OPS_STALE_DAYS = 2;
/** 改善バックログの Metric 列 → 運用系 source の対応 (active 施策数を出すため)。 */
export const OPS_METRIC_PATTERNS = { psi: /performance|psi|cwv/i, cloudflare: /cloudflare/i, sns: /sns|instagram|threads|youtube|^x$/i };

const addDaysIso = (date, days) => new Date(Date.parse(`${date}T00:00:00Z`) + days * 86400000).toISOString().slice(0, 10);
const inWindow = (date, asOf) => date <= asOf && date > addDaysIso(asOf, -OPS_WINDOW_DAYS);
const freshness = (latest, asOf) => (latest == null ? "missing" : latest < addDaysIso(asOf, -OPS_STALE_DAYS) ? "stale" : "ok");
const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  if (s.length === 0) return null;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** PSI history.csv (1 行 = 日 × URL × strategy、violations_* は日次 digest が budgets.json で判定済み)。 */
export function summarizePsi(rows, asOf) {
  const dates = rows.map((r) => r.date).filter((d) => d <= asOf).sort();
  const latest = dates[dates.length - 1] ?? null;
  const today = rows.filter((r) => r.date === latest);
  // score が空の行は PSI API の計測失敗。0 点として中央値・最低値に混ぜない (2026-09 に /areas/01000 で実際に起きた)
  const measured = (r) => r.score_performance !== "" && r.score_performance != null;
  const mobile = today.filter((r) => r.strategy === "mobile" && measured(r));
  const window = rows.filter((r) => inWindow(r.date, asOf));
  return {
    status: freshness(latest, asOf),
    latestDate: latest,
    daysInWindow: new Set(window.map((r) => r.date)).size,
    mobileMedianScore: median(mobile.map((r) => Number(r.score_performance))),
    urlsWithErrors: today.filter((r) => measured(r) && Number(r.violations_error) > 0).length,
    urlsMeasured: today.filter(measured).length,
    measurementFailures: today.filter((r) => !measured(r)).length,
    worstMobile: mobile
      .map((r) => ({ url: r.url, score: Number(r.score_performance), lcpMs: Number(r.lcp_ms) }))
      .sort((a, b) => a.score - b.score)
      .slice(0, 3),
  };
}

/**
 * Cloudflare history.csv と、日次 snapshot を threshold-check.mjs の evaluateRules で判定した結果。
 * @param {Array<object>} rows history.csv
 * @param {Array<{date:string, violations:Array<{severity:string,title:string}>}>} evaluated
 */
export function summarizeCloudflare(rows, evaluated, asOf) {
  const dates = rows.map((r) => r.date).filter((d) => d <= asOf).sort();
  const latest = dates[dates.length - 1] ?? null;
  const window = rows.filter((r) => inWindow(r.date, asOf));
  const total = (key) => sum(window, (r) => r[key]);
  const requests = total("workers_requests");
  const violations = evaluated.filter((e) => inWindow(e.date, asOf)).flatMap((e) => e.violations);
  const bySeverity = {};
  for (const v of violations) bySeverity[v.severity] = (bySeverity[v.severity] ?? 0) + 1;
  return {
    status: freshness(latest, asOf),
    latestDate: latest,
    daysInWindow: new Set(window.map((r) => r.date)).size,
    workersRequests: requests,
    workersErrorRate: ratio(total("workers_errors"), requests),
    r2ClassAOps: total("r2_class_a_ops"),
    r2ClassBOps: total("r2_class_b_ops"),
    r2EgressMb: Math.round(total("r2_egress_mb")),
    r2StorageGb: latest ? Number(rows.find((r) => r.date === latest).r2_storage_gb) : null,
    violationsBySeverity: bySeverity,
    violationTitles: [...new Set(violations.map((v) => v.title))],
  };
}

/** SNS metrics (sns-metrics-store.readByRange の行)。集計の定義は sns-weekly-report.mjs と同じ。 */
export function summarizeSns(rows) {
  const eng = (r) => ["likes", "comments", "shares", "saves"].reduce((s, k) => s + (Number(r[k]) || 0), 0);
  const byPlatform = {};
  // Instagram は impressions を廃止して reach / views に値が入る。3 つとも持ち、表示側で 0 でないものだけ出す
  for (const r of rows) {
    const p = (byPlatform[r.platform || "unknown"] ??= { posts: new Set(), impressions: 0, reach: 0, views: 0, engagements: 0 });
    p.posts.add(r.content_key || r.sns_post_id);
    for (const k of ["impressions", "reach", "views"]) p[k] += Number(r[k]) || 0;
    p.engagements += eng(r);
  }
  const platforms = Object.fromEntries(Object.entries(byPlatform).map(([k, { posts, ...rest }]) => [k, { posts: posts.size, ...rest }]));
  const fetched = rows.map((r) => String(r.fetched_at).slice(0, 10)).sort();
  return {
    status: rows.length ? "ok" : "missing",
    latestDate: fetched[fetched.length - 1] ?? null,
    platforms,
    topPosts: rows
      .map((r) => ({ platform: r.platform, contentKey: r.content_key, engagements: eng(r), impressions: Number(r.impressions) || 0 }))
      .sort((a, b) => b.engagements - a.engagements || b.impressions - a.impressions)
      .slice(0, 3),
  };
}

/** active 施策を運用系 source ごとに数える (その source の改善がバックログに載っているか)。 */
export function countOpsImprovements(entries) {
  return Object.fromEntries(Object.entries(OPS_METRIC_PATTERNS).map(([source, re]) => [
    source,
    entries.filter((e) => re.test(e.target_metric ?? "")).map((e) => e.section_id),
  ]));
}

const pct = (v) => (v == null ? "—" : `${(v * 100).toFixed(1)}%`);

export function renderCycleMarkdown(state) {
  const lines = [];
  const src = state.sources;
  lines.push(`計測週 **${state.week}**（GA4 rolling28d ${src.ga4.periodStart ?? "?"}〜${src.ga4.periodEnd ?? "?"}、Japan-only）。前週との差は重複期間なので WoW ではない。`);
  lines.push("");
  lines.push("| 入力 | 状態 |");
  lines.push("|---|---|");
  for (const [name, s] of Object.entries(src)) lines.push(`| ${name} | ${s.status}${s.detail ? `（${s.detail}）` : ""} |`);
  lines.push("");
  if (state.journey) {
    const j = state.journey;
    lines.push("**回遊（referrer 集計）**");
    lines.push("");
    lines.push("| 遷移 | page_view | 遷移元 PV | 率 |");
    lines.push("|---|---:|---:|---:|");
    lines.push(`| blog → ranking | ${j.blogToRanking.pageViews} | ${j.blogToRanking.fromPageViews} | ${pct(j.blogToRanking.rate)} |`);
    lines.push(`| themes → ranking | ${j.themesToRanking.pageViews} | ${j.themesToRanking.fromPageViews} | ${pct(j.themesToRanking.rate)} |`);
    lines.push(`| themes → blog | ${j.themesToBlog.pageViews} | ${j.themesToBlog.fromPageViews} | ${pct(j.themesToBlog.rate)} |`);
    lines.push("");
  }
  if (state.workContext) {
    const w = state.workContext;
    lines.push(`**業務文脈の着地**（平均: PC ${pct(w.baseline.desktopShare)}・平日 9–18 時 ${pct(w.baseline.workdayHoursShare)}。両方が平均超かつ ${WORK_CONTEXT_MIN_SESSIONS} セッション以上。行政実務者である証明ではない）`);
    lines.push("");
    if (w.top.length === 0) lines.push("該当なし");
    for (const r of w.top) lines.push(`- \`${r.landingPage}\` — ${r.sessions} セッション・PC ${pct(r.desktopShare)}・平日業務時間 ${pct(r.workdayHoursShare)}`);
    lines.push("");
  }
  if (state.dimensionGaps) {
    const d = state.dimensionGaps;
    lines.push(`**未登録の custom dimension**（${d.absentParams} パラメータ。登録はオーナー作業・遡及しない）`);
    lines.push("");
    for (const g of d.groups) {
      lines.push(`- ${g.breakdownReady ? "🟢 登録すれば内訳を読める" : "⚪ 発火量不足"} \`${g.events.join("` / `")}\`（28 日 ${g.eventCount28d} 件）: ${g.params.map((p) => `\`${p}\``).join(", ")}`);
    }
    lines.push("");
  }
  if (state.engine) {
    const e = state.engine;
    const domains = Object.entries(e.byDomain);
    lines.push(`**効果判定エンジン**（${e.verdictsWeek ?? "verdict 未生成"}）: ${domains.length === 0 ? "判定対象なし" : domains.map(([d, s]) => `${d} ${s.subjects} 件 ${JSON.stringify(s.byLabel)}`).join(" / ")}`);
    lines.push("");
    lines.push(`GSC 施策 ${e.gsc.active} 件中、機械判定できるのは ${e.gsc.judgeable} 件。残りは目印が欠けている（目標値は根拠があるときだけ書く）:`);
    lines.push("");
    for (const r of e.gsc.missing) lines.push(`- \`${r.id}\`: ${r.missing.join("・")}`);
    lines.push("");
  }
  if (state.operations) {
    const { psi, cloudflare, sns, improvements } = state.operations;
    const ids = (list) => (list.length ? list.map((id) => `\`${id}\``).join(", ") : "なし");
    lines.push(`**運用系の計測**（直近 ${OPS_WINDOW_DAYS} 日。閾値違反は日次 alert Issue と同じ判定。改善の判断は人）`);
    lines.push("");
    lines.push("| 計測 | 状態 | 要約 | 閾値違反 | active 施策 |");
    lines.push("|---|---|---|---|---|");
    if (psi) {
      lines.push(`| PSI | ${psi.status}（最新 ${psi.latestDate ?? "—"}） | モバイル中央値 ${psi.mobileMedianScore ?? "—"} 点・最低 ${psi.worstMobile.map((w) => `${new URL(w.url).pathname} ${w.score}`).join(" / ") || "—"}${psi.measurementFailures ? `・計測失敗 ${psi.measurementFailures}` : ""} | 最新日 ${psi.urlsWithErrors}/${psi.urlsMeasured} 計測で error | ${ids(improvements.psi)} |`);
    }
    if (cloudflare) {
      const sev = Object.entries(cloudflare.violationsBySeverity).map(([k, v]) => `${k} ${v}`).join("・") || "なし";
      lines.push(`| Cloudflare | ${cloudflare.status}（最新 ${cloudflare.latestDate ?? "—"}） | Workers ${cloudflare.workersRequests} req・error ${pct(cloudflare.workersErrorRate)}・R2 A ${cloudflare.r2ClassAOps} / B ${cloudflare.r2ClassBOps}・保存 ${cloudflare.r2StorageGb ?? "—"} GB | ${sev}${cloudflare.violationTitles.length ? `（${cloudflare.violationTitles.join("、")}）` : ""} | ${ids(improvements.cloudflare)} |`);
    }
    if (sns) {
      const reachText = (v) => ["impressions", "reach", "views"].filter((k) => v[k] > 0).map((k) => `${k} ${v[k]}`).join("・") || "表示指標 0";
      const per = Object.entries(sns.platforms).map(([p, v]) => `${p} ${v.posts} 投稿・${reachText(v)}・eng ${v.engagements}`).join(" / ") || "—";
      lines.push(`| SNS | ${sns.status}（最新 ${sns.latestDate ?? "—"}） | ${per} | —（閾値なし） | ${ids(improvements.sns)} |`);
    }
    lines.push("");
  }
  if (state.improvements) {
    const o = state.improvements;
    lines.push(`**期日超過の判定待ち**: active ${o.active} 件中 ${o.overdue.length} 件`);
    lines.push("");
    for (const e of o.overdue) lines.push(`- \`${e.id}\` ${e.status}（期日 ${e.due}・${e.metric ?? "-"}）`);
    lines.push("");
  }
  return lines.join("\n");
}
