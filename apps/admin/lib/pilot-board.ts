/**
 * 収益化 pilot の判定ボード。台帳 `data/business/pilot-board.json` と週次の記録から、
 * pilot ごとの開始日・判定日・指標の現在値・状態を決める。ファイルは読まない (読むのは lib/server/pilot-board.ts)。
 *
 * 状態の決め方 (上から順に最初に当たったもの):
 *   未開始   = 開始日が無い
 *   保留     = 実験台帳の最新の履歴が paused
 *   判定不能 = 指標のどれかが記録なし、または記録が古い
 *   計測中   = 今日が判定日より前
 *   判定待ち = 判定日を過ぎ、指標がそろっている
 */

export type PilotSchedule =
  | { kind: "window"; start: string | null; startEvidence: string; windowDays: number }
  | { kind: "improvement" | "experiment"; id: string };

export type PilotMetricSpec =
  | { label: string; kind: "ga4-nav-click"; surface: string }
  | { label: string; kind: "sales-ledger"; channel: string; productIds: string[] }
  | { label: string; kind: "note-dashboard"; noteIds: string[] }
  | { label: string; kind: "experiment"; id: string }
  | { label: string; kind: "unrecorded"; reason: string };

export interface PilotSpec {
  id: string;
  title: string;
  route: string;
  card: string;
  schedule: PilotSchedule;
  metrics: PilotMetricSpec[];
}

/** GA4 週次スナップショット 1 週分。nav-click-surfaces.csv は periodEnd で締めた直近 28 日の累計 */
export interface NavClickSnapshot {
  weekId: string;
  periodEnd: string;
  /** CSV が無い週は null (取得していない)。行が無い導線は 0 クリック */
  rows: Array<{ surface: string; count: number }> | null;
}

export interface SalesObservation {
  channel: string;
  productId: string;
  periodStart: string;
  periodEnd: string;
  units: number;
  netRevenueYen: number;
  recordedAt: string;
}

export interface NoteDashboard {
  fetchedAt: string;
  period: { start: string; end: string };
  articles: Array<{ noteId: string; title: string; publishedAt: string; pageViews: number; salesJpy: number }>;
}

export interface ExperimentRecord {
  id: string;
  title: string;
  status: string;
  experiment_window?: { start?: string; final_measurement?: string };
  next_check_date?: string | null;
  measuring_observations?: unknown[];
  pilot_videos?: Array<{ title: string; status: string }>;
  history?: Array<{ date: string; action: string }>;
}

export interface PilotInputs {
  today: string;
  navClicks: NavClickSnapshot[];
  sales: SalesObservation[] | null;
  note: NoteDashboard | null;
  experiments: ExperimentRecord[];
  /** improvements.md の ID → Due */
  improvementDue: Record<string, string>;
}

export type MetricStatus = "ok" | "waiting" | "missing" | "stale";
export type PilotState = "not-started" | "paused" | "no-data" | "measuring" | "due";

export interface PilotMetricResult {
  label: string;
  status: MetricStatus;
  value: string | null;
  observedAt: string | null;
  note: string;
}

export interface PilotRow {
  id: string;
  title: string;
  route: string;
  card: string;
  start: string | null;
  startEvidence: string;
  judgeDate: string | null;
  judgeSource: string;
  daysLeft: number | null;
  state: PilotState;
  stateNote: string;
  metrics: PilotMetricResult[];
}

/** この日数より古い記録は「記録が古い」とする (週次の記録 2 回分) */
export const STALE_DAYS = 14;
const NAV_CLICK_WINDOW_DAYS = 28;

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function daysBetween(from: string, to: string): number {
  return Math.round((Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)) / 86_400_000);
}

const isStale = (observedAt: string, today: string) => daysBetween(observedAt.slice(0, 10), today) > STALE_DAYS;

function navClickMetric(spec: { label: string; surface: string }, start: string | null, inp: PilotInputs): PilotMetricResult {
  const base = { label: spec.label, value: null, observedAt: null };
  const fetched = inp.navClicks.filter((s) => s.rows !== null).sort((a, b) => a.periodEnd.localeCompare(b.periodEnd));
  if (fetched.length === 0) return { ...base, status: "missing", note: "nav-click-surfaces.csv の記録なし" };
  if (!start) return { ...base, status: "waiting", note: "開始前" };
  // 反映前の日を含む 28 日窓は比較に混ぜない
  const valid = fetched.filter((s) => addDays(s.periodEnd, -(NAV_CLICK_WINDOW_DAYS - 1)) >= start);
  const latest = valid.at(-1);
  if (!latest) {
    const firstEnd = addDays(start, NAV_CLICK_WINDOW_DAYS - 1);
    return { ...base, status: "waiting", note: `反映後だけの28日窓がまだ無い (最初は ${firstEnd} 締め)` };
  }
  const count = latest.rows!.filter((r) => r.surface === spec.surface).reduce((sum, r) => sum + r.count, 0);
  const stale = isStale(latest.periodEnd, inp.today);
  return {
    label: spec.label,
    status: stale ? "stale" : "ok",
    value: `${count} クリック`,
    observedAt: latest.periodEnd,
    note: `${addDays(latest.periodEnd, -(NAV_CLICK_WINDOW_DAYS - 1))}〜${latest.periodEnd} の28日 (${latest.weekId})${stale ? "・記録が古い" : ""}`,
  };
}

function salesMetric(
  spec: { label: string; channel: string; productIds: string[] },
  start: string | null,
  end: string | null,
  inp: PilotInputs,
): PilotMetricResult {
  const base = { label: spec.label, value: null, observedAt: null };
  if (!start || !end) return { ...base, status: "waiting", note: "開始前" };
  if (inp.sales === null) return { ...base, status: "missing", note: "sales-ledger.json の記録なし" };
  const hits = inp.sales.filter(
    (o) =>
      o.channel === spec.channel &&
      (spec.productIds.length === 0 || spec.productIds.includes(o.productId)) &&
      o.periodStart <= end &&
      o.periodEnd >= start,
  );
  if (hits.length === 0) return { ...base, status: "missing", note: `窓 ${start}〜${end} に重なる ${spec.channel} の記録なし` };
  const units = hits.reduce((s, o) => s + o.units, 0);
  const yen = hits.reduce((s, o) => s + o.netRevenueYen, 0);
  const periods = [...new Set(hits.map((o) => `${o.periodStart}〜${o.periodEnd}`))].join("・");
  return {
    label: spec.label,
    status: "ok",
    value: `${units} 冊・¥${yen.toLocaleString("ja-JP")}`,
    observedAt: hits.map((o) => o.recordedAt.slice(0, 10)).sort().at(-1) ?? null,
    note: `記録の期間 ${periods} (月次の記録は窓の境界と一致しない)`,
  };
}

function noteMetric(spec: { label: string; noteIds: string[] }, inp: PilotInputs): PilotMetricResult {
  const base = { label: spec.label, value: null, observedAt: null };
  if (!inp.note) return { ...base, status: "missing", note: "note ダッシュボードの記録 (latest.json) なし" };
  const found = spec.noteIds.map((id) => inp.note!.articles.find((a) => a.noteId === id));
  if (found.some((a) => !a)) return { ...base, status: "missing", note: "対象の記事がダッシュボードの記録に無い" };
  const stale = isStale(inp.note.fetchedAt, inp.today);
  return {
    label: spec.label,
    status: stale ? "stale" : "ok",
    value: found.map((a) => `${a!.title.split(" — ")[0]}: ${a!.pageViews} PV・¥${a!.salesJpy}`).join(" / "),
    observedAt: inp.note.fetchedAt.slice(0, 10),
    note: `集計期間 ${inp.note.period.start}〜${inp.note.period.end}${stale ? "・記録が古い" : ""}`,
  };
}

function experimentMetric(spec: { label: string; id: string }, inp: PilotInputs): PilotMetricResult {
  const base = { label: spec.label, value: null, observedAt: null };
  const exp = inp.experiments.find((e) => e.id === spec.id);
  if (!exp) return { ...base, status: "missing", note: `${spec.id} が experiments.json に無い` };
  const videos = exp.pilot_videos ?? [];
  const published = videos.filter((v) => v.status === "published").length;
  const observations = exp.measuring_observations ?? [];
  return {
    label: spec.label,
    status: observations.length ? "ok" : "missing",
    value: `公開 ${published}/${videos.length} 本 (${videos.map((v) => v.status).join("・")})`,
    observedAt: exp.history?.at(-1)?.date.slice(0, 10) ?? null,
    note: observations.length ? `記録値 ${observations.length} 件` : "記録値 (measuring_observations) なし",
  };
}

function resolveDates(spec: PilotSpec, inp: PilotInputs): Pick<PilotRow, "start" | "startEvidence" | "judgeDate" | "judgeSource"> {
  const s = spec.schedule;
  if (s.kind === "window") {
    return {
      start: s.start,
      startEvidence: s.startEvidence,
      judgeDate: s.start ? addDays(s.start, s.windowDays) : null,
      judgeSource: `開始日 + ${s.windowDays} 日 (pilot-board.json)`,
    };
  }
  if (s.kind === "improvement") {
    const noteIds = spec.metrics.flatMap((m) => (m.kind === "note-dashboard" ? m.noteIds : []));
    const published = (inp.note?.articles ?? []).filter((a) => noteIds.includes(a.noteId)).map((a) => a.publishedAt).sort();
    return {
      start: published[0] ?? null,
      startEvidence: published[0] ? "note の公開日 (ダッシュボードの記録)" : "公開日の記録なし",
      judgeDate: inp.improvementDue[s.id] ?? null,
      judgeSource: `improvements.md の ${s.id} の Due`,
    };
  }
  const exp = inp.experiments.find((e) => e.id === s.id);
  return {
    start: exp?.experiment_window?.start ?? null,
    startEvidence: `experiments.json の ${s.id}`,
    judgeDate: exp?.experiment_window?.final_measurement ?? null,
    judgeSource: `experiments.json の ${s.id} の final_measurement`,
  };
}

export function buildPilotBoard(specs: PilotSpec[], inp: PilotInputs): PilotRow[] {
  return specs.map((spec) => {
    const dates = resolveDates(spec, inp);
    const windowEnd = dates.judgeDate ? addDays(dates.judgeDate, -1) : null;
    const metrics = spec.metrics.map((m): PilotMetricResult => {
      switch (m.kind) {
        case "ga4-nav-click":
          return navClickMetric(m, dates.start, inp);
        case "sales-ledger":
          return salesMetric(m, dates.start, windowEnd, inp);
        case "note-dashboard":
          return noteMetric(m, inp);
        case "experiment":
          return experimentMetric(m, inp);
        case "unrecorded":
          return { label: m.label, status: "missing", value: null, observedAt: null, note: m.reason };
      }
    });

    const daysLeft = dates.judgeDate ? daysBetween(inp.today, dates.judgeDate) : null;
    const schedule = spec.schedule;
    const exp = schedule.kind === "experiment" ? inp.experiments.find((e) => e.id === schedule.id) : undefined;
    const lastAction = exp?.history?.at(-1);
    const gaps = metrics.filter((m) => m.status === "missing" || m.status === "stale");

    let state: PilotState;
    let stateNote: string;
    if (!dates.start) {
      state = "not-started";
      stateNote = dates.startEvidence;
    } else if (lastAction?.action === "paused") {
      state = "paused";
      stateNote = `${lastAction.date.slice(0, 10)} から保留${exp?.next_check_date ? `・次の確認 ${exp.next_check_date}` : ""}`;
    } else if (gaps.length > 0) {
      state = "no-data";
      stateNote = gaps.map((m) => `${m.label}: ${m.status === "stale" ? "記録が古い" : m.note}`).join(" / ");
    } else if (daysLeft !== null && daysLeft > 0) {
      state = "measuring";
      stateNote = `判定まで ${daysLeft} 日`;
    } else {
      state = "due";
      stateNote = dates.judgeDate ? `判定日 ${dates.judgeDate} を過ぎた` : "判定日の記録なし";
    }

    return { id: spec.id, title: spec.title, route: spec.route, card: spec.card, ...dates, daysLeft, state, stateNote, metrics };
  });
}
