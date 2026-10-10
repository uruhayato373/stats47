/**
 * review-cadence.mjs — 週次・月次レビューと計画の「期限・本文の契約・申し送りの振り分け・配線」を判定する唯一の実装。
 *
 * 正本は .claude/config/review-wiring.json。読み手は次の 5 つで、判定をここ以外に書かない:
 *   - CLI check-review-cadence.mjs (人間向け・--json・--strict)
 *   - Stop hook check-weekly-cadence-on-stop.js (書き漏れの通知)
 *   - review-cadence-guard.yml (毎朝、期限切れ・契約違反を Issue にして直ったら閉じる)
 *   - docs:check DG084 (書いたレビューの契約違反を pre-commit / PR で止める)
 *   - 管理画面 /strategy/reviews/{weekly,monthly} と週次メトリクス Issue の「サイクルの健全性」節
 *
 * 判定の考え方 (doboku-note の移植。2026-10-01):
 *   - 週次レビュー: 完了した週 (日曜まで) ごとに 1 本。週 X のレビューは翌週の dueWeekday (正本の weekly) に必須になり、
 *     期限日から graceDays の間は催促 (warn) に留める。2026-10-10 から金曜に前週を計測し土曜に書く (dueWeekday 6)
 *   - 月次レビュー: 毎月 dueDay 日から前月分を必須にする
 *   - 計画: 週次は今週分 (plans.weekly.earliestWeekday 以降は来週分の先行作成も可)、月次は dueDay 日から今月分
 *   - 契約: contractFrom 以降のレビューだけ、必須見出しと申し送りの振り分け (→ 振り分け: <行き先>) を検査する。
 *     行き先のカード ID の実在は最新のレビューだけで見る (古いレビューの行き先は完了して消えるのが正常)
 */
import { existsSync, readFileSync, readdirSync } from "node:fs";
import { createRequire } from "node:module";
import { join } from "node:path";
import { datasetDir, datasetPath } from "../../../../config/datasets.mjs";

const require = createRequire(import.meta.url);
const { parseBacklog } = require("../../lib/backlog-lib.cjs");

export const WIRING_PATH = ".claude/config/review-wiring.json";
/** 遡って欠落を探す週数・月数 (これより古い穴は追わない) */
export const LOOKBACK_WEEKS = 10;
export const LOOKBACK_MONTHS = 3;
const TODO_FILES = [".claude/todo/backlog.md", ".claude/todo/improvements.md"];
const IMPROVEMENTS = ".claude/todo/improvements.md";
const EXPERIMENTS = datasetPath("business.experiments");
const BACKLOG_LEDGER = ".claude/state/backlog-loop/ledger.json";

const CARD_ID = /^[A-Z][A-Z0-9]*(?:-[A-Z0-9]+)+$/;
const EXP_ID = /^EXP-\d+$/;
const ISSUE_REF = /^#\d+$/;
const KEYWORD_ROUTES = ["定常", "見送り"];

// ---------- 日付 (JST の暦日で判定する) ----------

/** 基準時刻を JST の暦日 (UTC 0 時の Date) に直す */
export function jstDay(now = new Date()) {
  const jst = new Date(now.getTime() + 9 * 3_600_000);
  return new Date(Date.UTC(jst.getUTCFullYear(), jst.getUTCMonth(), jst.getUTCDate()));
}

export function isoWeekLabel(day) {
  const d = new Date(Date.UTC(day.getUTCFullYear(), day.getUTCMonth(), day.getUTCDate()));
  const dow = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dow);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d - yearStart) / 86_400_000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

const monthLabel = (d) => `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;
const addDays = (d, n) => new Date(d.getTime() + n * 86_400_000);
const addMonths = (d, n) => new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth() + n, 1));
const ymd = (d) => d.toISOString().slice(0, 10);

/** 今日を基準にした週・月の区切り */
export function calendar(day) {
  const dow = day.getUTCDay(); // 0=Sun
  const lastSunday = addDays(day, -(dow === 0 ? 7 : dow));
  return {
    today: ymd(day),
    currentWeek: isoWeekLabel(day),
    nextWeek: isoWeekLabel(addDays(day, 7)),
    lastCompletedWeek: isoWeekLabel(lastSunday),
    lastSunday,
    isSunday: dow === 0,
    currentMonth: monthLabel(day),
    previousMonth: monthLabel(addMonths(day, -1)),
    dayOfMonth: day.getUTCDate(),
    monthStart: addMonths(day, 0),
  };
}

/** 月曜=0〜日曜=6 の曜日 (getUTCDay は日曜=0) */
const mondayOffset = (jsWeekday) => (jsWeekday + 6) % 7;
const mondayOf = (day) => addDays(day, -mondayOffset(day.getUTCDay()));

/**
 * 週次レビューの期限。週 X のレビューは翌週の dueWeekday (getUTCDay の値。既定 1 = 月曜) に必須になる。
 * 期限日から graceDays 日の間 (既定 0) は、期限の週が欠けていても催促 (warn) に留める。
 * @returns {{week: string, lastSunday: Date, dueDate: Date, inGrace: boolean}} week は今日の時点で期限が来ている最新の週
 */
export function weeklyDue(day, conf = {}) {
  const monday = mondayOf(day);
  const thisWeekDue = addDays(monday, mondayOffset(conf.dueWeekday ?? 1));
  const reached = day >= thisWeekDue;
  const dueDate = reached ? thisWeekDue : addDays(thisWeekDue, -7);
  const lastSunday = addDays(monday, reached ? -1 : -8);
  return { week: isoWeekLabel(lastSunday), lastSunday, dueDate, inGrace: day < addDays(dueDate, conf.graceDays ?? 0) };
}

/** 来週の週次計画を先に書いてよい曜日に達したか (plans.weekly.earliestWeekday。既定 0 = 日曜) */
function planAheadAllowed(day, planConf = {}) {
  return mondayOffset(day.getUTCDay()) >= mondayOffset(planConf.earliestWeekday ?? 0);
}

/** 週次計画 (weekly.md の week) として受け付ける週。今週、earliestWeekday 以降は来週も。docs:check の DG032 も使う */
export function acceptedWeeklyPlanWeeks(day, planConf = {}) {
  const cal = calendar(day);
  return planAheadAllowed(day, planConf) ? [cal.currentWeek, cal.nextWeek] : [cal.currentWeek];
}

/**
 * 週 X のレビューの申し送りを拾う週次計画の週。期限日に来週の計画を先に書ける運用 (土曜にレビューと計画) なら
 * 期限日の翌週、そうでなければ期限日の週 (月曜にレビューしてその週の計画を書く運用)。
 * GSC 運用サイクルの監査 (audit-operations-cycle.mjs) も同じ関数で「計測週 → 次の計画」を決める。
 */
export function handoffPlanWeek(week, wiring) {
  const dueDate = addDays(new Date(`${weekRange(week).end}T00:00:00Z`), 1 + mondayOffset(wiring.cadences.weekly.dueWeekday ?? 1));
  return isoWeekLabel(addDays(dueDate, planAheadAllowed(dueDate, wiring.plans.weekly) ? 7 : 0));
}

// ---------- 読み込み ----------

const readText = (root, rel) => {
  const abs = join(root, rel);
  return existsSync(abs) ? readFileSync(abs, "utf8") : null;
};

export function loadWiring(root) {
  return JSON.parse(readText(root, WIRING_PATH));
}

/** レビューのファイル一覧 (期間の新しい順) */
export function listReviews(root, conf) {
  const dir = join(root, conf.dir);
  if (!existsSync(dir)) return [];
  const re = new RegExp(conf.periodPattern);
  return readdirSync(dir)
    .map((f) => ({ f, period: f.match(re)?.[1] }))
    .filter((x) => x.period)
    .sort((a, b) => b.period.localeCompare(a.period))
    .map(({ f, period }) => ({ period, path: `${conf.dir}/${f}`, text: readFileSync(join(dir, f), "utf8") }));
}

/** 申し送りの行き先として実在を確かめる ID (backlog / improvements のカード + 実験) */
export function loadIdIndex(root) {
  const ids = new Set();
  for (const rel of TODO_FILES) for (const c of parseBacklog(readText(root, rel) ?? "")) if (c.id) ids.add(c.id);
  // improvements.md の施策は `### [ID]` 見出しではなく表の 1 列目に ID を持つ
  for (const line of (readText(root, IMPROVEMENTS) ?? "").split("\n")) {
    const m = line.match(/^\|\s*([A-Z0-9]+(?:-[A-Z0-9]+)+)\s*\|/);
    if (m) ids.add(m[1]);
  }
  // 完了して backlog から消えたカードも行き先として有効 (ゲート証拠付きで閉じた ID は架空の ID ではない)
  const ledger = readText(root, BACKLOG_LEDGER);
  if (ledger) {
    for (const [id, item] of Object.entries(JSON.parse(ledger).items ?? {})) if (item?.status === "completed") ids.add(id);
  }
  const exp = readText(root, EXPERIMENTS);
  if (exp) {
    const parsed = JSON.parse(exp);
    const list = Array.isArray(parsed) ? parsed : parsed.experiments ?? [];
    for (const e of list) if (e?.id) ids.add(e.id);
  }
  return ids;
}

// ---------- 本文の契約 ----------

const squash = (s) => s.replace(/\s+/g, "");

/** `## 見出し` ごとに本文を切る。コードフェンス内の見出しは無視する */
export function splitSections(text) {
  const sections = [];
  let fence = false;
  let current = null;
  for (const line of String(text).split("\n")) {
    if (/^\s*```/.test(line)) fence = !fence;
    const m = !fence && line.match(/^##\s+(.+?)\s*$/);
    if (m) {
      current = { heading: m[1], lines: [] };
      sections.push(current);
    } else if (current) current.lines.push(line);
  }
  return sections;
}

/** 必須見出しは前方一致 (空白は無視)。「KPI ツリー（重点レーン）」も「KPI ツリー」を満たす */
export function findSection(sections, name) {
  const want = squash(name);
  return sections.find((s) => squash(s.heading).startsWith(want)) ?? null;
}

/** 申し送り節の項目 (先頭が `- ` / `* ` / `1. ` の行。字下げされた続きの行は同じ項目) */
export function handoffItems(lines) {
  const items = [];
  for (const line of lines) {
    if (/^(?:[-*]|\d+\.)\s+/.test(line)) items.push(line.replace(/^(?:[-*]|\d+\.)\s+/, "").trim());
    else if (items.length && /^\s+\S/.test(line)) items[items.length - 1] += ` ${line.trim()}`;
  }
  return items;
}

/** `→ 振り分け: A / B` の行き先を取り出す。無ければ null */
export function parseRoutes(item, marker) {
  const at = item.lastIndexOf(marker);
  if (at < 0) return null;
  return item
    .slice(at + marker.length)
    .split(/[/／、,]/)
    .map((t) => t.trim().replace(/^`|`$/g, ""))
    .map((t) => t.split(/[\s（(]/)[0])
    .filter(Boolean);
}

/** 行き先 1 つの判定。checkIds=false なら形だけ見る */
export function classifyRoute(route, ids, checkIds) {
  if (KEYWORD_ROUTES.includes(route) || ISSUE_REF.test(route)) return "ok";
  if (EXP_ID.test(route) || CARD_ID.test(route)) return !checkIds || ids.has(route) ? "ok" : "unknown-id";
  return "invalid";
}

/** 1 本のレビューの契約判定 */
export function checkReview(review, conf, { marker, ids, checkIds }) {
  const inContract = review.period >= conf.contractFrom;
  const sections = splitSections(review.text);
  const missingSections = inContract ? conf.requiredSections.filter((n) => !findSection(sections, n)) : [];
  const handoffSection = findSection(sections, conf.handoffSection);
  const items = handoffSection ? handoffItems(handoffSection.lines) : [];
  const handoff = items.map((text) => {
    const routes = parseRoutes(text, marker);
    if (!inContract) return { text, routes, problem: null };
    if (!routes || routes.length === 0) return { text, routes: [], problem: "unrouted" };
    const bad = routes.map((r) => ({ r, v: classifyRoute(r, ids, checkIds) })).filter((x) => x.v !== "ok");
    return { text, routes, problem: bad.length ? `${bad[0].v}:${bad.map((x) => x.r).join(",")}` : null };
  });
  return {
    period: review.period,
    path: review.path,
    inContract,
    missingSections,
    handoff,
    routed: handoff.filter((h) => h.routes && h.routes.length && !h.problem).length,
  };
}

// ---------- 配線 (inputs) ----------

/** inputs の run は SKILL.md に同じ文字列があること・実体があること、read はパスが実在すること */
export function checkWiring(root, wiring) {
  const pkg = JSON.parse(readText(root, "package.json") ?? "{}").scripts ?? {};
  const rows = [];
  for (const [cadence, conf] of Object.entries(wiring.cadences)) {
    const skillText = [readText(root, conf.skill), readText(root, conf.skill.replace(/SKILL\.md$/, "reference/runbook.md"))]
      .filter(Boolean)
      .join("\n");
    if (readText(root, conf.skill) === null) rows.push({ cadence, label: conf.label, target: conf.skill, problem: "スキルが無い" });
    for (const input of conf.inputs ?? []) {
      let problem = null;
      if (input.run) {
        const npm = input.run.match(/^npm run (\S+)/)?.[1];
        const file = input.run.match(/^node (\S+)/)?.[1];
        if (npm && !pkg[npm]) problem = `package.json に ${npm} が無い`;
        else if (file && !existsSync(join(root, file))) problem = `${file} が無い`;
        else if (!skillText.includes(input.run)) problem = "スキルの手順に無い";
      } else if (input.read && !existsSync(join(root, input.read))) problem = "パスが無い";
      rows.push({ cadence, label: input.label, target: input.run ?? input.read, problem });
    }
  }
  return rows;
}

// ---------- 期限 ----------

function weeklyExpected(due, reviews) {
  const present = new Set(reviews.map((r) => r.period));
  if (present.size === 0) return [];
  const earliest = [...present].sort()[0];
  const want = [];
  for (let i = 0; i < LOOKBACK_WEEKS; i++) want.push(isoWeekLabel(addDays(due.lastSunday, -7 * i)));
  return [...new Set(want)].filter((w) => w >= earliest && !present.has(w)).sort();
}

function monthlyExpected(cal, reviews, conf) {
  const present = new Set(reviews.map((r) => r.period));
  const lastDue = cal.dayOfMonth >= conf.dueDay ? cal.previousMonth : monthLabel(addMonths(cal.monthStart, -2));
  const want = [];
  for (let i = 0; i < LOOKBACK_MONTHS; i++) {
    const m = monthLabel(addMonths(new Date(`${lastDue}-01T00:00:00Z`), -i));
    if (m >= conf.contractFrom) want.push(m);
  }
  return want.filter((m) => !present.has(m)).sort();
}

const frontmatterValue = (text, key) => text?.match(new RegExp(`^${key}:\\s*(\\S+)\\s*$`, "m"))?.[1] ?? null;

// ---------- 月次 workflow の実行記録 ----------

/** 月次ジョブごとの、指定月の記録 (record-monthly-job.mjs が書く) */
export function monthlyJobRuns(root, wiring, month) {
  const conf = wiring.monthlyJobs;
  if (!conf) return [];
  return conf.jobs.map((j) => {
    const text = readText(root, `${conf.dir}/${j.job}.json`);
    const run = text ? (JSON.parse(text).runs ?? []).find((r) => r.month === month) ?? null : null;
    return { ...j, run };
  });
}

/** 今月分: 失敗した・実行日 + 猶予を過ぎても記録が無いジョブ (毎朝のガードが error にする) */
function monthlyJobFindings(root, wiring, cal) {
  const conf = wiring.monthlyJobs;
  if (!conf) return [];
  const out = [];
  for (const j of monthlyJobRuns(root, wiring, cal.currentMonth)) {
    if (j.run?.status === "failed") {
      out.push({ severity: "error", code: "monthly-job-failed", file: `${conf.dir}/${j.job}.json`, message: `月次の自動処理「${j.label}」の ${cal.currentMonth} 分が失敗した`, fix: `${j.run.runUrl ?? j.workflow} のログを見て直し、${j.workflow} を workflow_dispatch で再実行する` });
    } else if (!j.run && cal.dayOfMonth > j.day + conf.graceDays) {
      out.push({ severity: "error", code: "monthly-job-missing", file: `${conf.dir}/${j.job}.json`, message: `月次の自動処理「${j.label}」の ${cal.currentMonth} 分の記録が無い (実行日 ${j.day} 日)`, fix: `gh run list --workflow ${j.workflow} で起動を確認し、走っていなければ workflow_dispatch で実行する` });
    }
  }
  return out;
}

// ---------- 全体 ----------

export function reviewCadence(root, now = new Date()) {
  const wiring = loadWiring(root);
  const day = jstDay(now);
  const cal = calendar(day);
  const due = weeklyDue(day, wiring.cadences.weekly);
  const ids = loadIdIndex(root);
  const marker = wiring.handoffRouting.marker;
  const findings = [];
  const status = [];
  const reviews = {};

  for (const [cadence, conf] of Object.entries(wiring.cadences)) {
    const list = listReviews(root, conf);
    reviews[cadence] = list.map((r, i) => checkReview(r, conf, { marker, ids, checkIds: i === 0 }));
    const missing = cadence === "weekly" ? weeklyExpected(due, list) : monthlyExpected(cal, list, conf);
    const expected = cadence === "weekly" ? due.week : cal.dayOfMonth >= conf.dueDay ? cal.previousMonth : null;
    status.push({
      kind: `${cadence}-review`,
      label: conf.label,
      command: conf.command,
      latest: list[0]?.period ?? null,
      expected,
      nextDue: cadence === "monthly" && cal.dayOfMonth < conf.dueDay ? `${cal.currentMonth}-${String(conf.dueDay).padStart(2, "0")}` : null,
      missing,
      ok: missing.length === 0,
    });
    for (const p of missing) {
      // 期限当日 (graceDays の間) は催促だけ。毎朝のガードは error だけを Issue にするので、期限日の朝に Issue を出さない
      const dueToday = cadence === "weekly" && p === due.week && due.inGrace;
      findings.push({
        severity: dueToday ? "warn" : "error",
        code: dueToday ? "review-due" : "review-missing",
        message: dueToday ? `${conf.label} ${p} の期限は今日 (${ymd(due.dueDate)})` : `${conf.label} ${p} が無い`,
        fix: `${conf.command} ${p} を実行し ${conf.dir}/${p}.md に保存する`,
      });
    }
    reviews[cadence].forEach((r, i) => {
      if (!r.inContract) return;
      const severity = i === 0 ? "error" : "warn";
      if (r.missingSections.length) {
        findings.push({
          severity,
          code: "section-missing",
          file: r.path,
          message: `${conf.label} ${r.period} に必須の見出しが無い: ${r.missingSections.join(" / ")}`,
          fix: `${r.path} に「## ${r.missingSections[0]}」などを足す (正本 ${WIRING_PATH})`,
        });
      }
      const bad = r.handoff.filter((h) => h.problem);
      if (bad.length) {
        findings.push({
          severity,
          code: "handoff-unrouted",
          file: r.path,
          message: `${conf.label} ${r.period} の「${conf.handoffSection}」で行き先が無い・不明な項目 ${bad.length} / ${r.handoff.length} 件`,
          fix: `各項目の末尾に「${marker} <カード ID / EXP-NNN / #Issue / 定常 / 見送り>」を書く。カード ID は backlog / improvements に実在するもの`,
          items: bad.map((h) => `${h.text.slice(0, 60)} (${h.problem})`),
        });
      }
    });
  }

  // 計画
  const weeklyPlanWeek = frontmatterValue(readText(root, wiring.plans.weekly.file), "week");
  const planAhead = planAheadAllowed(day, wiring.plans.weekly);
  const acceptedWeeks = acceptedWeeklyPlanWeeks(day, wiring.plans.weekly);
  const weeklyPlanOk = acceptedWeeks.includes(weeklyPlanWeek);
  status.push({
    kind: "weekly-plan",
    label: wiring.plans.weekly.label,
    command: wiring.plans.weekly.command,
    latest: weeklyPlanWeek,
    expected: planAhead ? cal.nextWeek : cal.currentWeek,
    nextDue: null,
    missing: weeklyPlanOk ? [] : [planAhead ? cal.nextWeek : cal.currentWeek],
    ok: weeklyPlanOk,
  });
  const monthlyPlan = wiring.plans.monthly;
  const monthlyPlanMonth = frontmatterValue(readText(root, monthlyPlan.file), "month");
  const monthlyPlanDue = cal.dayOfMonth >= monthlyPlan.dueDay;
  const monthlyPlanOk = monthlyPlanMonth === cal.currentMonth || (!monthlyPlanDue && monthlyPlanMonth === cal.previousMonth);
  status.push({
    kind: "monthly-plan",
    label: monthlyPlan.label,
    command: monthlyPlan.command,
    latest: monthlyPlanMonth,
    expected: cal.currentMonth,
    nextDue: monthlyPlanDue ? null : `${cal.currentMonth}-${String(monthlyPlan.dueDay).padStart(2, "0")}`,
    missing: monthlyPlanOk ? [] : [cal.currentMonth],
    ok: monthlyPlanOk,
  });
  for (const s of status.filter((x) => x.kind.endsWith("-plan") && !x.ok)) {
    findings.push({
      severity: "error",
      code: "plan-missing",
      message: `${s.label} ${s.expected} が無い (現在 ${s.latest ?? "なし"})`,
      fix: `${s.command} ${s.expected} を実行する`,
    });
  }

  findings.push(...monthlyJobFindings(root, wiring, cal));

  const wiringRows = checkWiring(root, wiring);
  for (const w of wiringRows.filter((r) => r.problem)) {
    findings.push({
      severity: "error",
      code: "wiring-broken",
      file: WIRING_PATH,
      message: `${wiring.cadences[w.cadence].label} の入力「${w.label}」: ${w.problem}`,
      fix: `${WIRING_PATH} の inputs とスキルの手順を揃える (${w.target})`,
    });
  }

  return { ...omitInternal(cal), reviewDueWeek: due.week, reviewDueDate: ymd(due.dueDate), status, reviews, wiring: wiringRows, findings, marker };
}

function omitInternal(cal) {
  const { lastSunday, monthStart, ...rest } = cal;
  return rest;
}

/** 人間向け・Issue 本文用の Markdown */
export function formatCadence(result) {
  const lines = ["## 週次・月次レビューの状態", ""];
  lines.push(`今日 ${result.today} / 完了済みの最新週 ${result.lastCompletedWeek} / 期限が来ている週次レビュー ${result.reviewDueWeek} (期限 ${result.reviewDueDate}) / 今月 ${result.currentMonth}`, "");
  lines.push("| 対象 | 期待 | 最新 | 状態 |", "|---|---|---|---|");
  for (const s of result.status) {
    const state = s.ok ? (s.nextDue ? `✅ (次の期限 ${s.nextDue})` : "✅") : `⚠️ 欠落 ${s.missing.join(", ")} → \`${s.command}\``;
    lines.push(`| ${s.label} | ${s.expected ?? "—"} | ${s.latest ?? "なし"} | ${state} |`);
  }
  lines.push("");
  const errors = result.findings.filter((f) => f.severity === "error");
  const warns = result.findings.filter((f) => f.severity === "warn");
  if (errors.length === 0 && warns.length === 0) {
    lines.push("✅ 期限・本文の契約・申し送りの振り分け・配線に問題なし。");
    return lines.join("\n");
  }
  for (const [title, list] of [["要対応", errors], ["注意 (期限当日・過去のレビュー)", warns]]) {
    if (!list.length) continue;
    lines.push(`### ${title} (${list.length})`, "");
    for (const f of list) {
      lines.push(`- **${f.message}** — ${f.fix}`);
      for (const item of (f.items ?? []).slice(0, 8)) lines.push(`  - ${item}`);
    }
    lines.push("");
  }
  return lines.join("\n");
}

/** 申し送りの振り分け率 (週次メトリクス Issue の「振り返り → 起票」行) */
export function handoffSummary(result, cadence = "weekly") {
  const latest = result.reviews[cadence]?.[0];
  if (!latest) return null;
  return { period: latest.period, inContract: latest.inContract, routed: latest.routed, total: latest.handoff.length };
}


// ---------- 回ごとの実施状況 (管理画面の週次・月次ページ) ----------

const MEASUREMENT_HISTORY = `${datasetDir("business.measurement-cycle")}/history.csv`;
const VERDICT_DIR = datasetDir("effect.verdicts");
const COMPETITOR_REPORTS = ".claude/skills/sns/competitor-scan/reference/reports";

/** ISO 週 YYYY-Www の月曜〜日曜 */
export function weekRange(week) {
  const [y, w] = week.split("-W").map(Number);
  const jan4 = new Date(Date.UTC(y, 0, 4));
  const monday = addDays(jan4, -((jan4.getUTCDay() || 7) - 1) + (w - 1) * 7);
  return { start: ymd(monday), end: ymd(addDays(monday, 6)) };
}

/** 月 YYYY-MM の初日〜末日 */
export function monthRange(month) {
  const first = new Date(`${month}-01T00:00:00Z`);
  return { start: ymd(first), end: ymd(addDays(addMonths(first, 1), -1)) };
}

/** 木曜がその月に入る ISO 週 (月次レビューが集約する週) */
export function weeksOfMonth(month) {
  const { start, end } = monthRange(month);
  const weeks = new Set();
  for (let d = new Date(`${start}T00:00:00Z`); ymd(d) <= end; d = addDays(d, 1)) {
    if (d.getUTCDay() === 4) weeks.add(isoWeekLabel(d));
  }
  return [...weeks];
}

function measuredWeeks(root) {
  const text = readText(root, MEASUREMENT_HISTORY);
  if (!text) return [];
  return text.split("\n").slice(1).map((l) => l.split(",")[0]).filter((w) => /^\d{4}-W\d{2}$/.test(w));
}

/** 状態: done / partial / missing / unknown (記録の開始前など、判定できない) / skipped (契約前) */
function step(label, does, state, note) {
  return { label, does, state, note };
}

function sectionText(text, name) {
  const s = findSection(splitSections(text), name);
  return s ? s.lines.join("\n").trim() : null;
}

/**
 * 1 回分 (週次は ISO 週、月次は月) の実施状況・手順・判断。
 * 手順は「計測 → 記録 → 振り返り → 起票 → 計画」の順で、根拠のファイルが確認できたかを出す。
 */
export function reviewRun(root, cadence, period, now = new Date()) {
  const result = reviewCadence(root, now);
  const wiring = loadWiring(root);
  const conf = wiring.cadences[cadence];
  const list = listReviews(root, conf);
  const index = list.findIndex((r) => r.period === period);
  const file = index >= 0 ? list[index] : null;
  const check = index >= 0 ? result.reviews[cadence][index] : null;
  const range = cadence === "weekly" ? weekRange(period) : monthRange(period);
  const statusRow = result.status.find((s) => s.kind === `${cadence}-review`);
  const isLatest = index === 0;

  const measured = measuredWeeks(root);
  const firstMeasured = measured.slice().sort()[0] ?? null;
  const weekState = (w) => (measured.includes(w) ? "done" : firstMeasured && w < firstMeasured ? "unknown" : "missing");
  const verdictExists = (w) => existsSync(join(root, VERDICT_DIR, `verdicts-${w}.json`));

  const steps = [];
  if (cadence === "weekly") {
    const ms = weekState(period);
    steps.push(step("計測", "金曜の fetch-metrics-weekly が前週の計測→記録→改善サイクルの state を作る", ms, ms === "unknown" ? `計測履歴は ${firstMeasured} から` : MEASUREMENT_HISTORY));
    steps.push(step("効果判定", "閾値エンジンがその週の施策の効果を判定する", verdictExists(period) ? "done" : "missing", `${VERDICT_DIR}/verdicts-${period}.json`));
  } else {
    const weeks = weeksOfMonth(period);
    const reviewed = weeks.filter((w) => listReviews(root, wiring.cadences.weekly).some((r) => r.period === w));
    steps.push(step("週次レビュー", `月内の週次レビュー (${weeks[0]}〜${weeks.at(-1)}) が揃っている`, reviewed.length === weeks.length ? "done" : reviewed.length ? "partial" : "missing", `${reviewed.length} / ${weeks.length} 週`));
    const judged = weeks.filter(verdictExists);
    steps.push(step("効果判定", "月内の各週で閾値エンジンが施策を判定している", judged.length === weeks.length ? "done" : judged.length ? "partial" : "missing", `${judged.length} / ${weeks.length} 週`));
    const jobs = monthlyJobRuns(root, wiring, period);
    const recorded = jobs.filter((x) => x.run && x.run.status !== "failed");
    const failed = jobs.filter((x) => x.run?.status === "failed");
    steps.push(step("月次の自動処理", `月次 workflow (${jobs.map((x) => x.label).join("・")}) が対象月に走り、結果を記録した`,
      recorded.length === jobs.length ? "done" : recorded.length || failed.length ? "partial" : "missing",
      jobs.map((x) => `${x.label}: ${x.run ? x.run.status : "記録なし"}`).join(" / ")));
    const scans = existsSync(join(root, COMPETITOR_REPORTS)) ? readdirSync(join(root, COMPETITOR_REPORTS)).filter((f) => f.startsWith(period)) : [];
    steps.push(step("月次の定点観測", "/competitor-scan が対象月にレポートを書いた", scans.length ? "done" : "missing", scans[0] ? `${COMPETITOR_REPORTS}/${scans[0]}` : `${COMPETITOR_REPORTS} に ${period} のレポートなし`));
  }
  steps.push(step("レビューを保存", `${conf.command} が ${conf.dir}/${period}.md に書く`, file ? "done" : "missing", file?.path ?? "未作成"));
  if (!file) {
    steps.push(step("必須の見出し", "正本の requiredSections がすべてある", "missing", "レビューが無い"));
    steps.push(step("申し送りの振り分け", `各項目の末尾に「${wiring.handoffRouting.marker} <行き先>」`, "missing", "レビューが無い"));
  } else if (!check.inContract) {
    steps.push(step("必須の見出し", "正本の requiredSections がすべてある", "skipped", `契約の開始 ${conf.contractFrom} より前`));
    steps.push(step("申し送りの振り分け", `各項目の末尾に「${wiring.handoffRouting.marker} <行き先>」`, "skipped", `契約の開始 ${conf.contractFrom} より前`));
  } else {
    steps.push(step("必須の見出し", "正本の requiredSections がすべてある", check.missingSections.length ? "partial" : "done", check.missingSections.length ? `不足: ${check.missingSections.join(" / ")}` : `${conf.requiredSections.length} 見出し`));
    if (cadence === "monthly") {
      for (const [name, does] of [["収益の締め", "収益源ごとの発生・確定と判定不能の理由"], ["実験の判定", "期日が来た実験の継続・終了・延長"], ["点検と Issue", "開いているアラート Issue と月次の自動処理の振り分け"]]) {
        const body = sectionText(file.text, name);
        steps.push(step(name, does, body ? "done" : "missing", body ? `${body.split("\n").filter((l) => l.startsWith("|")).length} 行` : "見出しが無い"));
      }
    }
    const all = check.handoff.length;
    steps.push(step("申し送りの振り分け", `各項目の末尾に「${wiring.handoffRouting.marker} <行き先>」`, all === 0 ? "missing" : check.routed === all ? "done" : "partial", `${check.routed} / ${all} 件`));
  }
  // 次の計画への引き継ぎは、計画ファイルが「次の回」を指しているときだけ判定できる (過去の計画は上書きされている)
  const plan = wiring.plans[cadence];
  const planText = readText(root, plan.file) ?? "";
  const planPeriod = frontmatterValue(planText, cadence === "weekly" ? "week" : "month");
  const nextPeriod = cadence === "weekly" ? handoffPlanWeek(period, wiring) : monthLabel(addMonths(new Date(`${period}-01T00:00:00Z`), 1));
  const routedIds = (check?.handoff ?? []).flatMap((h) => h.routes ?? []).filter((r) => CARD_ID.test(r) || EXP_ID.test(r));
  if (planPeriod !== nextPeriod) {
    steps.push(step("次の計画へ引き継ぎ", `${plan.command} が ${nextPeriod} の計画で申し送りの行き先を拾う`, planPeriod && planPeriod > nextPeriod ? "unknown" : "missing", planPeriod && planPeriod > nextPeriod ? "計画は上書き済みで過去分は判定できない" : `${plan.file} は ${planPeriod ?? "なし"}`));
  } else if (routedIds.length === 0) {
    steps.push(step("次の計画へ引き継ぎ", `${plan.command} が ${nextPeriod} の計画で申し送りの行き先を拾う`, "unknown", "振り分け済みのカード ID が無い"));
  } else {
    const picked = routedIds.filter((id) => planText.includes(id));
    steps.push(step("次の計画へ引き継ぎ", `${plan.command} が ${nextPeriod} の計画で申し送りの行き先を拾う`, picked.length === routedIds.length ? "done" : "partial", `計画に載った ID ${picked.length} / ${routedIds.length}`));
  }

  // 期限前の回 (月次は 3 日まで) は未実施ではなく「期限前」
  const notYetDue = !file && !(statusRow?.missing ?? []).includes(period) && (cadence === "monthly" ? Boolean(statusRow?.nextDue) : period > result.reviewDueWeek);
  const verdict = !file ? (notYetDue ? "upcoming" : "missing") : steps.some((s) => s.state === "missing" || s.state === "partial") ? "partial" : "ok";
  const options = [...new Set([period, ...list.map((r) => r.period), ...(statusRow?.missing ?? [])])]
    .sort((a, b) => b.localeCompare(a))
    .map((p) => ({ key: p, missing: !list.some((r) => r.period === p) }));

  return {
    cadence,
    label: conf.label,
    command: conf.command,
    period,
    range,
    isLatest,
    verdict,
    nextDue: notYetDue ? statusRow?.nextDue ?? null : null,
    steps,
    summary: file ? sectionText(file.text, "サマリー") : null,
    handoff: check?.handoff ?? [],
    handoffSection: conf.handoffSection,
    inContract: check?.inContract ?? period >= conf.contractFrom,
    path: file?.path ?? `${conf.dir}/${period}.md`,
    options,
    status: result.status.filter((s) => s.kind.startsWith(cadence)),
    findings: result.findings.filter((f) => (f.file ?? "").startsWith(conf.dir) || f.message.startsWith(conf.label) || f.message.startsWith(plan.label)),
    wiring: result.wiring.filter((w) => w.cadence === cadence),
    marker: wiring.handoffRouting.marker,
  };
}

/** ページを開いたときに選ぶ回: 期限が来ている最新の回 (無ければ最新のレビュー) */
export function defaultRun(root, cadence, now = new Date()) {
  const result = reviewCadence(root, now);
  const s = result.status.find((x) => x.kind === `${cadence}-review`);
  return s.expected ?? s.latest ?? (cadence === "weekly" ? result.reviewDueWeek : result.previousMonth);
}
