import assert from "node:assert/strict";
import { mkdirSync, mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { test } from "node:test";

import { classifyRoute, parseRoutes, reviewCadence, reviewRun, weekRange, weeksOfMonth } from "../lib/review-cadence.mjs";

// 実リポジトリの state に依存しないよう、配線の正本と台帳を持つ小さなリポジトリを毎回組み立てる。
const WEEKLY_SECTIONS = ["サマリー", "計画 vs 実績", "来週への申し送り"];
const MONTHLY_SECTIONS = ["サマリー", "来月への申し送り"];

function write(root, rel, text) {
  mkdirSync(dirname(join(root, rel)), { recursive: true });
  writeFileSync(join(root, rel), text);
}

function review(sections, handoffHeading, handoffLines) {
  return sections
    .map((h) => (h === handoffHeading ? `## ${h}\n\n${handoffLines.join("\n")}\n` : `## ${h}\n\n本文\n`))
    .join("\n");
}

function fixture({ weeks = {}, months = {}, weeklyPlan = "2026-W41", monthlyPlan = "2026-10", skillText } = {}) {
  const root = mkdtempSync(join(tmpdir(), "review-cadence-"));
  write(
    root,
    ".claude/config/review-wiring.json",
    JSON.stringify({
      handoffRouting: { marker: "→ 振り分け:" },
      cadences: {
        weekly: {
          label: "週次レビュー",
          skill: "skills/weekly/SKILL.md",
          command: "/weekly-review",
          dir: "reviews/weekly",
          periodPattern: "^(\\d{4}-W\\d{2})\\.md$",
          contractFrom: "2026-W40",
          requiredSections: WEEKLY_SECTIONS,
          handoffSection: "来週への申し送り",
          inputs: [
            { label: "契約検査", run: "node tools/check.mjs" },
            { label: "計画", read: "plans/weekly.md" },
          ],
        },
        monthly: {
          label: "月次レビュー",
          skill: "skills/monthly/SKILL.md",
          command: "/monthly-review",
          dir: "reviews/monthly",
          periodPattern: "^(\\d{4}-\\d{2})\\.md$",
          dueDay: 3,
          contractFrom: "2026-09",
          requiredSections: MONTHLY_SECTIONS,
          handoffSection: "来月への申し送り",
          inputs: [],
        },
      },
      plans: {
        weekly: { label: "週次計画", file: "plans/weekly.md", command: "/weekly-plan" },
        monthly: { label: "月次計画", file: "plans/monthly.md", command: "/monthly-plan", dueDay: 3 },
      },
    }),
  );
  write(root, ".claude/todo/backlog.md", "## 🔴 高\n\n### [LIVE-CARD-01] 生きているカード\nタグ: [収益化]\n\n本文\n");
  write(root, ".claude/todo/improvements.md", "");
  write(root, ".claude/state/experiments.json", JSON.stringify([{ id: "EXP-007" }]));
  write(root, "package.json", JSON.stringify({ scripts: {} }));
  write(root, "tools/check.mjs", "");
  write(root, "skills/weekly/SKILL.md", skillText ?? "node tools/check.mjs");
  write(root, "skills/monthly/SKILL.md", "");
  write(root, "plans/weekly.md", `---\nweek: ${weeklyPlan}\n---\n`);
  write(root, "plans/monthly.md", `---\nmonth: ${monthlyPlan}\n---\n`);
  for (const [w, text] of Object.entries(weeks)) write(root, `reviews/weekly/${w}.md`, text);
  for (const [m, text] of Object.entries(months)) write(root, `reviews/monthly/${m}.md`, text);
  return root;
}

const okWeek = (routes = ["LIVE-CARD-01"]) =>
  review(WEEKLY_SECTIONS, "来週への申し送り", routes.map((r, i) => `${i + 1}. 項目 → 振り分け: ${r}`));
const okMonth = review(MONTHLY_SECTIONS, "来月への申し送り", ["- 項目 → 振り分け: 定常"]);
const at = (date) => new Date(`${date}T12:00:00+09:00`);
const codes = (r, severity) => r.findings.filter((f) => !severity || f.severity === severity).map((f) => f.code);

test("週次レビューは週が終わった翌日 (月曜) から必須になり、日曜は今週分をまだ求めない", () => {
  const root = fixture({ weeks: { "2026-W39": okWeek(), "2026-W40": okWeek() } });
  // 2026-10-11 は日曜 (W41 の最終日)。W41 はまだ終わっていない扱い
  const sunday = reviewCadence(root, at("2026-10-11"));
  assert.deepEqual(sunday.status.find((s) => s.kind === "weekly-review").missing, []);
  // 翌月曜には W41 が欠落になる
  const monday = reviewCadence(root, at("2026-10-12"));
  assert.deepEqual(monday.status.find((s) => s.kind === "weekly-review").missing, ["2026-W41"]);
  assert.ok(codes(monday, "error").includes("review-missing"));
});

test("月次レビューは dueDay (3 日) から前月分を必須にし、それより前は次の期限だけを出す", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek() } });
  const day2 = reviewCadence(root, at("2026-10-02"));
  const monthly2 = day2.status.find((s) => s.kind === "monthly-review");
  assert.deepEqual(monthly2.missing, []);
  assert.equal(monthly2.nextDue, "2026-10-03");
  const day3 = reviewCadence(root, at("2026-10-03"));
  assert.deepEqual(day3.status.find((s) => s.kind === "monthly-review").missing, ["2026-09"]);
  // contractFrom (2026-09) より前の月は遡って求めない
  const nov = reviewCadence(fixture({ weeks: { "2026-W40": okWeek() }, months: { "2026-09": okMonth } }), at("2026-11-05"));
  assert.deepEqual(nov.status.find((s) => s.kind === "monthly-review").missing, ["2026-10"]);
});

test("月次計画は 3 日まで前月分を許し、3 日以降は今月分を求める", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek() }, monthlyPlan: "2026-09", weeklyPlan: "2026-W40" });
  assert.ok(reviewCadence(root, at("2026-10-02")).status.find((s) => s.kind === "monthly-plan").ok);
  const day3 = reviewCadence(root, at("2026-10-03"));
  assert.equal(day3.status.find((s) => s.kind === "monthly-plan").ok, false);
  assert.ok(codes(day3, "error").includes("plan-missing"));
});

test("必須見出しの欠落は最新のレビューで error、過去のレビューで warn、contractFrom より前は検査しない", () => {
  const missing = review(["サマリー", "来週への申し送り"], "来週への申し送り", ["1. 項目 → 振り分け: 定常"]);
  const root = fixture({ weeks: { "2026-W39": missing, "2026-W40": missing, "2026-W41": missing } });
  const r = reviewCadence(root, at("2026-10-14"));
  const sectionFindings = r.findings.filter((f) => f.code === "section-missing");
  assert.deepEqual(sectionFindings.map((f) => f.severity), ["error", "warn"]);
  assert.match(sectionFindings[0].message, /2026-W41/);
  assert.equal(r.reviews.weekly.find((x) => x.period === "2026-W39").inContract, false);
});

test("申し送りの行き先が無い・実在しないカード ID は最新のレビューで error になる", () => {
  const unrouted = review(WEEKLY_SECTIONS, "来週への申し送り", ["1. 行き先なし", "2. 正しい → 振り分け: LIVE-CARD-01"]);
  const r1 = reviewCadence(fixture({ weeks: { "2026-W40": unrouted } }), at("2026-10-06"));
  const f1 = r1.findings.find((f) => f.code === "handoff-unrouted");
  assert.equal(f1.severity, "error");
  assert.match(f1.message, /1 \/ 2/);
  assert.equal(r1.reviews.weekly[0].routed, 1);

  const ghost = okWeek(["GONE-CARD-01"]);
  const r2 = reviewCadence(fixture({ weeks: { "2026-W40": ghost } }), at("2026-10-06"));
  assert.match(r2.findings.find((f) => f.code === "handoff-unrouted").items[0], /unknown-id:GONE-CARD-01/);
});

test("古いレビューの行き先は完了して消えていてよい (実在の検査は最新だけ)", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek(["GONE-CARD-01"]), "2026-W41": okWeek() } });
  const r = reviewCadence(root, at("2026-10-14"));
  assert.deepEqual(codes(r).filter((c) => c === "handoff-unrouted"), []);
});

test("行き先は EXP・Issue・定常・見送りも受け付け、形の崩れたものは invalid にする", () => {
  const ids = new Set(["LIVE-CARD-01", "EXP-007"]);
  assert.deepEqual(parseRoutes("x → 振り分け: `LIVE-CARD-01` / EXP-007、#1058", "→ 振り分け:"), ["LIVE-CARD-01", "EXP-007", "#1058"]);
  assert.deepEqual(parseRoutes("x → 振り分け: 見送り（需要なし）", "→ 振り分け:"), ["見送り"]);
  assert.equal(parseRoutes("x", "→ 振り分け:"), null);
  assert.equal(classifyRoute("EXP-007", ids, true), "ok");
  assert.equal(classifyRoute("EXP-999", ids, true), "unknown-id");
  assert.equal(classifyRoute("定常", ids, true), "ok");
  assert.equal(classifyRoute("あとで", ids, true), "invalid");
});

test("配線: inputs の run がスキルの手順に無い・read のパスが無いと wiring-broken になる", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek() }, skillText: "手順にコマンドが無い" });
  const r = reviewCadence(root, at("2026-10-06"));
  const wiring = r.wiring.filter((w) => w.problem).map((w) => w.problem);
  assert.deepEqual(wiring, ["スキルの手順に無い"]);
  assert.ok(codes(r, "error").includes("wiring-broken"));
});

test("全部揃っていれば findings は 0 件", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek(), "2026-W41": okWeek() }, months: { "2026-09": okMonth }, weeklyPlan: "2026-W42" });
  assert.deepEqual(reviewCadence(root, at("2026-10-13")).findings, []);
});

test("週の範囲は月曜〜日曜、月次が集約する週は木曜がその月に入る ISO 週", () => {
  assert.deepEqual(weekRange("2026-W40"), { start: "2026-09-28", end: "2026-10-04" });
  assert.deepEqual(weeksOfMonth("2026-09"), ["2026-W36", "2026-W37", "2026-W38", "2026-W39"]);
});

// 意図: 管理画面の週次・月次ページは回ごとに「未実施」「期限前」「不足あり」「実施できた」を出し分ける。
// 期限前の月次を未実施と出すと、毎月 1〜2 日に偽の警告が出る
test("回ごとの判定: 期限前・未実施・不足あり・実施できた", () => {
  const root = fixture({ weeks: { "2026-W40": okWeek(["定常"]), "2026-W41": review(["サマリー"], "来週への申し送り", []) }, weeklyPlan: "2026-W42" });
  assert.equal(reviewRun(root, "monthly", "2026-09", at("2026-10-02")).verdict, "upcoming");
  assert.equal(reviewRun(root, "monthly", "2026-09", at("2026-10-05")).verdict, "missing");
  assert.equal(reviewRun(root, "weekly", "2026-W41", at("2026-10-13")).verdict, "partial");
  const w40 = reviewRun(root, "weekly", "2026-W40", at("2026-10-13"));
  assert.equal(w40.steps.find((x) => x.label === "申し送りの振り分け").state, "done");
  assert.ok(w40.options.some((o) => o.key === "2026-W41"));
});
