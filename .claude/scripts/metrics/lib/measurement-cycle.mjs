/**
 * 計測→記録→改善サイクルの週次状態 (pure)。
 *
 * 週次 snapshot (GA4 journey slice) と GA4 custom dimension の登録状況、改善バックログを突き合わせ、
 * 週次メトリクス Issue / weekly-review / CI の improvement-triage run が同じ事実を読むための 1 つの state にする。
 * 欠けた入力は 0 に丸めず status で区別する (evidence-based-judgment)。
 */
import { describeChannel, weeklyProductRevenue } from "./product-revenue.mjs";
import { reconcileDimensions } from "../../google-admin/dimension-ledger.mjs";
import { isoWeekOf, isoWeekRange } from "./periods.mjs";
import { datasetDir } from "../../../../config/datasets.mjs";

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

/**
 * サイト内クリックの計測の被覆率 (NAV-CLICK-COVERAGE-01 P4)。
 * 分母はサイト内のページ移動 (referrer 集計・計装に依らない)、分子は導線名の付いた nav_click。
 * 導線名なし (unlabeled) の上位は、次に導線名を付けるべき行き先のページ種別を示す。
 * @param {{ transitions: object[], navClicks: object[] }} input  navClicks は nav-click-surfaces.csv (nav_surface, nav_label, eventCount)
 */
export function summarizeNavCoverage({ transitions, navClicks }) {
  const internalTransitions = sum(transitions, (r) => r.pageViews);
  const total = sum(navClicks, (r) => r.eventCount);
  const unlabeledRows = navClicks.filter((r) => r.nav_surface === "unlabeled");
  const unlabeled = sum(unlabeledRows, (r) => r.eventCount);
  const labeled = total - unlabeled;
  return {
    internalTransitions,
    navClicks: total,
    labeledClicks: labeled,
    coverage: ratio(labeled, internalTransitions),
    unlabeledShare: ratio(unlabeled, total),
    topUnlabeled: unlabeledRows
      .map((r) => ({ label: r.nav_label, clicks: Number(r.eventCount) }))
      .sort((a, b) => b.clicks - a.clicks)
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
  const qualifying = rows
    .filter((r) => r.sessions >= WORK_CONTEXT_MIN_SESSIONS
      && r.desktopShare > baseline.desktopShare && r.workdayHoursShare > baseline.workdayHoursShare)
    .sort((a, b) => b.sessions * b.desktopShare * b.workdayHoursShare - a.sessions * a.desktopShare * a.workdayHoursShare);
  // qualifyingSessions は KPI work-context-sessions の値 (上位 N 件に切らない全件の合計)
  return { baseline, qualifyingSessions: sum(qualifying, (r) => r.sessions), top: qualifying.slice(0, WORK_CONTEXT_TOP) };
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

/**
 * rolling28d の値を比べる相手。隣の週は 21 日が重複するので WoW と呼べない。4 週前なら窓が重ならない
 * (収益化戦略 §1・search-growth weekly-cycle-contract)。
 */
export const KPI_COMPARE_WEEKS_BACK = 4;

/** YYYY-Www を n 週ずらす (週の月曜を日付でずらし、ISO 週へ戻す)。 */
export function shiftIsoWeek(week, n) {
  return isoWeekOf(addDaysIso(isoWeekRange(week).monday, n * 7));
}

/** 整合性監査の中で「指標単位の不合格」を表す一覧 (いずれかに入った指標を不合格と数える)。 */
const INTEGRITY_FAILURE_LISTS = [
  ["itemMissing"], ["valuesMissing"], ["yearMismatch"],
  ["stats", "missing"], ["stats", "empty"], ["stats", "drift"],
  ["normalized", "missing"], ["normalized", "stale"],
  ["shape", "violations"],
  ["recipe", "unbaked"], ["recipe", "drift"], ["recipe", "configMissing"],
  ["valueVerification", "profileViolated"],
  ["calculated", "staleYears"], ["calculated", "depsMissing"],
];

const keyOf = (v) => (typeof v === "string" ? v : v?.key ?? v?.rankingKey ?? v?.metric ?? null);

/**
 * データ品質ゲート通過率 = 週次のランキング整合性監査で、どの検査にも引っかからなかった公開指標の割合。
 * 検査の定義は ranking-integrity-audit (週次 CI) が持ち、ここは一覧を数えるだけ。
 * @param {object|null} audit data/ranking/integrity-audit.json
 */
export function summarizeDataQuality(audit) {
  const active = Number(audit?.totals?.activeKeys);
  if (!audit || !Number.isFinite(active) || active <= 0) return null;
  const failing = new Map();
  for (const path of INTEGRITY_FAILURE_LISTS) {
    const list = path.reduce((v, k) => v?.[k], audit);
    if (!Array.isArray(list)) continue;
    for (const item of list) {
      const key = keyOf(item);
      if (key) failing.set(key, [...(failing.get(key) ?? []), path.join(".")]);
    }
  }
  return {
    generatedAt: audit.generatedAt ?? null,
    active,
    failing: failing.size,
    passRate: ratio(active - failing.size, active),
    byCheck: Object.fromEntries(
      INTEGRITY_FAILURE_LISTS.map((path) => [path.join("."), path.reduce((v, k) => v?.[k], audit)])
        .filter(([, list]) => Array.isArray(list) && list.length > 0)
        .map(([name, list]) => [name, list.length]),
    ),
  };
}

/**
 * 有料購入 = 販売台帳で期間末が今週の実売記録。台帳は手で証拠付きの記録を足す方式で、KDP・ココナラ・note の
 * 売上を自動で取り込む経路が無い。よって記録 0 件でも販売中の商品があれば 0 件と書かず判定不能にする
 * (週次 Issue の productRevenueLine と同じ扱い)。
 */
export function summarizePaidPurchases({ ledger, liveProductCount, weekStart, weekEnd, revenueHistory = null }) {
  const observations = Array.isArray(ledger?.observations) ? ledger.observations : null;
  if (observations == null) return { status: "missing", value: null, note: "sales-ledger.json が無い" };
  const inWeek = observations.filter((o) => typeof o?.periodEnd === "string" && o.periodEnd >= weekStart && o.periodEnd <= weekEnd);
  if (inWeek.length > 0) {
    const total = inWeek.reduce((sum, o) => sum + (Number(o.netRevenueYen) || 0), 0);
    return { status: "ok", value: `${inWeek.length} 件・¥${total.toLocaleString("ja-JP")}` };
  }
  if (revenueHistory) {
    const week = weeklyProductRevenue({ revenueHistory, weekStart, weekEnd });
    const detail = Object.entries(week.channels).map(([name, r]) => describeChannel(name, r)).join(" / ");
    if (week.status === "ok") return { status: "ok", value: `${week.count ?? "件数不明"}${week.count == null ? "" : " 件"}・¥${week.yen.toLocaleString("ja-JP")}`, note: detail };
    return { status: "unmeasurable", value: null, note: detail };
  }
  if (liveProductCount === 0) return { status: "ok", value: "0 件", note: "販売中の商品なし" };
  return {
    status: "unmeasurable",
    value: null,
    note: `今週の実売記録 0 件${liveProductCount == null ? "" : `・販売中は少なくとも ${liveProductCount} 点`}。売上を台帳へ自動で入れる経路が無いので 0 件とは限らない`,
  };
}

/**
 * KPI ツリー (事業計画 catalog → kpi-tree.json) の各ノードに、今週の値・非重複の比較値・ぶら下がる施策を付ける。
 * 値を出せないノードは 0 にせず status で理由を示す (not-connected = 計測サイクルに未接続、stale / missing = 入力の欠落)。
 *
 * @param {object} input
 * @param {Array<{id,label,tier,measurementStatus,unit}>|null} input.nodes kpi-tree.json の nodes
 * @param {string} input.week
 * @param {string} input.asOf
 * @param {Array<object>|null} input.gscHistory data/gsc/history.csv
 * @param {Array<object>|null} input.cycleHistory measurement-cycle/history.csv (今週の行を除く過去分)
 * @param {object|null} input.journey summarizeJourney の結果
 * @param {object|null} input.workContext summarizeWorkContext の結果
 * @param {Array<object>|null} input.affiliateRows data/affiliate/ga4-affiliate-history.csv
 * @param {object|null} input.operations buildOperations の結果
 * @param {object|null} input.authenticated data/authenticated/latest.json (ASP・note・KDP 等の認証付き収集)
 * @param {Array<{id:string, kpis:string[]|null}>} input.improvementRows strategy-lanes.parseImprovementRows
 * @param {string[]} input.focusKpis 今月の重点レーンの KPI id
 * @param {number} input.maxActive active 施策の上限
 */
export function summarizeKpiTree({ nodes, week, asOf, gscHistory, cycleHistory, journey, workContext, affiliateRows, operations, authenticated = null, dataQuality = null, paidPurchases = null, improvementRows, focusKpis, maxActive }) {
  if (!nodes) return null;
  const prevWeek = shiftIsoWeek(week, -KPI_COMPARE_WEEKS_BACK);
  const gscNow = gscHistory?.find((r) => r.week === week) ?? null;
  const gscPrev = gscHistory?.find((r) => r.week === prevWeek) ?? null;
  const cyclePrev = cycleHistory?.find((r) => r.week === prevWeek) ?? null;
  const num = (v) => (v === "" || v == null || Number.isNaN(Number(v)) ? null : Number(v));
  const aff = (affiliateRows ?? [])
    .filter((r) => r.affiliate_vertical === "_all" && r.link_position === "_all" && r.date <= asOf)
    .sort((a, b) => a.date.localeCompare(b.date) || Number(a.days) - Number(b.days))
    .at(-1) ?? null;
  const affStale = aff ? aff.date < addDaysIso(asOf, -OPS_WINDOW_DAYS) : true;
  const psi = operations?.psi ?? null;
  const cf = operations?.cloudflare ?? null;
  const sns = operations?.sns ?? null;
  const freshnessChecks = [
    { name: "gsc", ok: Boolean(gscNow) },
    { name: "ga4", ok: Boolean(journey) && Boolean(workContext) },
    { name: "affiliate", ok: Boolean(aff) && !affStale },
    { name: "psi", ok: psi?.status === "ok" },
    { name: "cloudflare", ok: cf?.status === "ok" },
    { name: "sns", ok: sns?.status === "ok" },
    // 認証付き収集 (ASP 成果・販売実績)。認証切れは cron が緑のまま観測だけ止まる経路なので個別に数える
    ...(authenticated?.sources ?? []).map((src) => ({ name: `${src.source}${src.code ? `(${src.code})` : ""}`, ok: src.status === "pass" })),
  ];

  /** @returns {{status:string, value:string|null, previous:string|null, note?:string}} */
  const valueOf = (id) => {
    switch (id) {
      case "weekly-revenue":
        return { status: "see-nsm", value: null, previous: null, note: "内訳と判定不能の理由は週次 Issue の「週次収益 (NSM)」節" };
      case "search-clicks":
        return gscNow
          ? { status: "ok", value: `${num(gscNow.clicks_rolling28d)}`, previous: gscPrev ? `${num(gscPrev.clicks_rolling28d)}` : null }
          : { status: "missing", value: null, previous: null, note: `gsc/history.csv に ${week} の行が無い` };
      case "site-circulation-rate":
        return journey
          ? { status: "ok", value: pct(journey.blogToRanking.rate), previous: num(cyclePrev?.blogToRankingRate) == null ? null : pct(num(cyclePrev.blogToRankingRate)) }
          : { status: "missing", value: null, previous: null, note: "GA4 internal-transitions / pages-clean が無い" };
      case "work-context-sessions":
        return workContext
          ? { status: "ok", value: `${workContext.qualifyingSessions}`, previous: num(cyclePrev?.workContextSessions) == null ? null : `${num(cyclePrev.workContextSessions)}` }
          : { status: "missing", value: null, previous: null, note: "GA4 landing-context が無い" };
      case "affiliate-yield":
        if (!aff) return { status: "missing", value: null, previous: null, note: "ga4-affiliate-history.csv に全体行が無い" };
        return {
          status: affStale ? "stale" : "partial",
          value: `GA4 ${aff.days}日 imp ${num(aff.impressions)}・click ${num(aff.clicks)}`,
          previous: null,
          note: `最終観測 ${aff.date}。収益効率 (確定収益/1,000 imp) は ASP 成果と合わせて NSM 節で判定する`,
        };
      case "data-quality-pass-rate": {
        if (!dataQuality) return { status: "missing", value: null, previous: null, note: "ranking/integrity-audit.json が無い" };
        const stale = dataQuality.generatedAt && dataQuality.generatedAt.slice(0, 10) < addDaysIso(asOf, -OPS_WINDOW_DAYS);
        const detail = Object.entries(dataQuality.byCheck).map(([k, n]) => `${k} ${n}`).join("・");
        return {
          status: stale ? "stale" : "ok",
          value: `${pct(dataQuality.passRate)} (${dataQuality.active - dataQuality.failing}/${dataQuality.active})`,
          previous: num(cyclePrev?.dataQualityPassRate) == null ? null : pct(num(cyclePrev.dataQualityPassRate)),
          note: `監査 ${dataQuality.generatedAt?.slice(0, 10) ?? "?"}${detail ? `・不合格 ${detail}` : ""}`,
        };
      }
      case "paid-purchases":
        return paidPurchases
          ? { status: paidPurchases.status, value: paidPurchases.value, previous: null, note: paidPurchases.note }
          : { status: "missing", value: null, previous: null };
      case "site-health":
        return psi || cf
          ? { status: psi?.status === "ok" && cf?.status === "ok" ? "ok" : "partial", value: `PSI モバイル中央値 ${psi?.mobileMedianScore ?? "—"}・Workers error ${pct(cf?.workersErrorRate)}`, previous: null }
          : { status: "missing", value: null, previous: null };
      case "operating-cost": {
        if (!cf) return { status: "missing", value: null, previous: null };
        const v = Object.values(cf.violationsBySeverity).reduce((a, b) => a + b, 0);
        return { status: cf.status, value: `閾値違反 ${v} 件・R2 保存 ${cf.r2StorageGb ?? "—"} GB`, previous: null };
      }
      case "measurement-freshness": {
        const ok = freshnessChecks.filter((c) => c.ok).length;
        const bad = freshnessChecks.filter((c) => !c.ok).map((c) => c.name);
        return { status: bad.length ? "degraded" : "ok", value: `${ok}/${freshnessChecks.length}`, previous: null, note: bad.length ? `欠測・古い・認証切れ: ${bad.join(", ")}` : undefined };
      }
      default:
        return { status: "not-connected", value: null, previous: null, note: "値の取得元が計測サイクルに未接続。接続するまで判定しない" };
    }
  };

  const linked = new Map(nodes.map((n) => [n.id, []]));
  const unlinked = [];
  for (const row of improvementRows) {
    const ids = (row.kpis ?? []).filter((id) => linked.has(id));
    if (ids.length === 0) unlinked.push(row.id);
    for (const id of ids) linked.get(id).push(row.id);
  }
  const focus = new Set(focusKpis ?? []);
  return {
    compareWeek: prevWeek,
    nodes: nodes.map((n) => ({ ...n, focus: focus.has(n.id), ...valueOf(n.id), improvements: linked.get(n.id) })),
    improvements: { active: improvementRows.length, maxActive, unlinked, noTarget: improvementRows.filter((r) => !r.hasTarget).map((r) => r.id) },
    focusWithoutImprovements: nodes.filter((n) => focus.has(n.id) && linked.get(n.id).length === 0).map((n) => n.id),
  };
}

const TIER_LABEL = { nsm: "NSM", driver: "駆動", guardrail: "守り" };

function renderKpiTree(k) {
  const lines = [];
  lines.push(`**KPI ツリー**（正典: 事業計画 catalog → \`${datasetDir("business-plan.state")}/kpi-tree.json\`。比較は ${KPI_COMPARE_WEEKS_BACK} 週前 ${k.compareWeek} = 窓が重ならない値。★ = 今月の重点レーンの KPI）`);
  lines.push("");
  lines.push("| 階層 | KPI | 今週 | 比較 | 目標 | 状態 | 施策 |");
  lines.push("|---|---|---|---|---|---|---|");
  for (const n of k.nodes) {
    const imp = n.improvements.length ? n.improvements.map((id) => `\`${id}\``).join(", ") : "—";
    lines.push(`| ${TIER_LABEL[n.tier] ?? n.tier} | ${n.focus ? "★ " : ""}${n.label} | ${n.value ?? "—"} | ${n.previous ?? "—"} | ${n.target ? `${n.target.value.toLocaleString("ja-JP")}（${n.target.dueWeek}）` : "—"} | ${n.status}${n.note ? `（${n.note}）` : ""} | ${imp} |`);
  }
  lines.push("");
  const i = k.improvements;
  lines.push(`**施策の配線**: active ${i.active} 件（上限 ${i.maxActive} 件${i.active > i.maxActive ? "。超過中は新しい施策を足さず月次で削る" : ""}）・KPI 未接続 ${i.unlinked.length} 件・\`[target:]\` なし ${i.noTarget.length} 件`);
  if (k.focusWithoutImprovements.length) {
    lines.push("");
    lines.push(`重点レーンの KPI なのに施策が 0 件: ${k.focusWithoutImprovements.map((id) => `\`${id}\``).join(", ")}（今月の重点を動かす施策が台帳に無い）`);
  }
  lines.push("");
  return lines;
}

export function renderCycleMarkdown(state) {
  const lines = [];
  const src = state.sources;
  lines.push(`計測週 **${state.week}**（GA4 rolling28d ${src.ga4.periodStart ?? "?"}〜${src.ga4.periodEnd ?? "?"}、Japan-only）。前週との差は重複期間なので WoW ではない。`);
  lines.push("");
  lines.push("| 入力 | 状態 |");
  lines.push("|---|---|");
  for (const [name, s] of Object.entries(src)) lines.push(`| ${name} | ${s.status}${s.detail ? `（${s.detail}）` : ""} |`);
  lines.push("");
  if (state.kpiTree) lines.push(...renderKpiTree(state.kpiTree));
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
  if (state.navCoverage) {
    const n = state.navCoverage;
    lines.push(`**サイト内クリックの計測**: 導線名付きクリック ${n.labeledClicks} ÷ サイト内の移動 ${n.internalTransitions} = 被覆率 ${pct(n.coverage)}。` +
      `nav_click ${n.navClicks} 件のうち導線名なし ${pct(n.unlabeledShare)}`);
    if (n.topUnlabeled.length > 0) {
      lines.push("");
      lines.push("導線名なしの行き先 (上位。次に導線名を付ける候補):");
      for (const r of n.topUnlabeled) lines.push(`- ${r.label} — ${r.clicks} クリック`);
    }
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
