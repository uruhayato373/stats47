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
  if (state.improvements) {
    const o = state.improvements;
    lines.push(`**期日超過の判定待ち**: active ${o.active} 件中 ${o.overdue.length} 件`);
    lines.push("");
    for (const e of o.overdue) lines.push(`- \`${e.id}\` ${e.status}（期日 ${e.due}・${e.metric ?? "-"}）`);
    lines.push("");
  }
  return lines.join("\n");
}
