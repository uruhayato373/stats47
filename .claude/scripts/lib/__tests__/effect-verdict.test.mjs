/**
 * effect-verdict engine のテスト。
 *
 * 群 A (正常系): 想定 +100 に対する実測で full / partial / none / adverse が出ること。
 * 群 B (mutation): thresholds を動かすと判定が**変わること**。
 *   全 PASS はゲートが何も見ていない場合と区別できないため、
 *   「閾値を 0 にしたら none → full に変わる」「imp 下限を 0 にしたら pending → 確定」を
 *   明示的に assert する (変わらなければ engine が閾値を読んでいない = ゲート無効)。
 *
 * 正典: .claude/rules/evidence-based-judgment.md §状況 1
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import {
  decideVerdict,
  detectConfounders,
  extractDeployDate,
  extractTarget,
  formatVerdictSection,
  LABELS,
  GUARD_CODES,
} from "../effect-verdict/engine.mjs";
import { DEFAULT_THRESHOLDS, mergeThresholds, THRESHOLDS_VERSION } from "../effect-verdict/thresholds.mjs";
import { isoWeekOf, weekDiff, weekLt, weekIndex } from "../effect-verdict/iso-week.mjs";
import { upsertSection } from "../effect-verdict/section-upsert.mjs";
import { classifyAge } from "../../search-growth/lib/freshness.mjs";

// __tests__ → lib → scripts → .claude → repo root
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

/** 群 A 共通: before 20 (imp 500) / after 20+delta (imp 500) / 想定 +100 / 判定窓 4 週 / fresh source。 */
function subject(delta, over = {}) {
  return {
    before: { value: 20, impressions: 500 },
    after: { value: 20 + delta, impressions: 500 },
    target: 100,
    window: { beforeWeek: "2026-W26", afterWeek: "2026-W30" },
    sources: [{ name: "gsc", observedAt: "2026-07-26T00:00:00Z" }],
    confounders: { coDeployed: [], laterContaminators: [] },
    now: "2026-07-28T00:00:00Z",
    ...over,
  };
}

// ── 群 A: 正常系 ────────────────────────────────────────────────────────

test("群A: 想定 +100 に対し実測 +95 → effect/full", () => {
  const v = decideVerdict(subject(95));
  assert.equal(v.label, LABELS.full);
  assert.deepEqual(v.guards, []);
  assert.equal(v.attainment, 0.95);
  assert.match(v.reason, /達成率 95\.0% ≥ attainment\.full 80\.0%/);
});

test("群A: 実測 +40 → effect/partial", () => {
  const v = decideVerdict(subject(40));
  assert.equal(v.label, LABELS.partial);
  assert.equal(v.attainment, 0.4);
});

test("群A: 実測 +2 → effect/none (noise floor は超えるが達成率不足)", () => {
  const v = decideVerdict(subject(2));
  assert.equal(v.label, LABELS.none);
  assert.equal(v.attainment, 0.02);
  assert.deepEqual(v.guards, [], "相対変化 10% は minRelativeDelta 5% を超えるのでガードは出ない");
});

test("群A: 実測 -30 → effect/adverse (達成率より adverse を先に見る)", () => {
  const v = decideVerdict(subject(-30));
  assert.equal(v.label, LABELS.adverse);
  assert.match(v.reason, /adverse\.relativeDrop/);
});

test("群A: 判定に使った境界値が verdict に焼かれる", () => {
  const v = decideVerdict(subject(95));
  assert.deepEqual(v.boundaries, {
    attainmentFull: 0.8,
    attainmentPartial: 0.3,
    adverseRelativeDrop: -0.1,
  });
  assert.equal(v.thresholdsVersion, THRESHOLDS_VERSION);
});

// ── 群 B: mutation (閾値が実際に効いていることの証明) ──────────────────

test("群B: attainment.full=0 を注入すると +2 の判定が none → full に変わる", () => {
  const base = decideVerdict(subject(2));
  assert.equal(base.label, LABELS.none, "前提: 既定閾値では none");

  const mutated = decideVerdict(subject(2), mergeThresholds({ attainment: { full: 0 } }));
  assert.equal(
    mutated.label,
    LABELS.full,
    "engine が thresholds.attainment.full を読んでいなければここで落ちる (ゲート無効の検出)",
  );
  assert.equal(mutated.boundaries.attainmentFull, 0);
});

test("群B: sample.minImpressionsBefore=0 を注入すると imp 3 件の pending が確定ラベルに変わる", () => {
  const thin = subject(40, {
    before: { value: 20, impressions: 3 },
    after: { value: 60, impressions: 500 },
  });
  const base = decideVerdict(thin);
  assert.equal(base.label, LABELS.pending, "前提: 既定閾値では標本不足で pending");
  assert.deepEqual(
    base.guards.map((g) => g.code),
    ["insufficient-sample"],
  );

  const mutated = decideVerdict(thin, mergeThresholds({ sample: { minImpressionsBefore: 0 } }));
  assert.equal(
    mutated.label,
    LABELS.partial,
    "engine が thresholds.sample.minImpressionsBefore を読んでいなければここで落ちる",
  );
  assert.deepEqual(mutated.guards, []);
});

test("群B: adverse.relativeDrop を緩めると adverse が none に変わる", () => {
  const s = subject(-30);
  assert.equal(decideVerdict(s).label, LABELS.adverse);
  const mutated = decideVerdict(s, mergeThresholds({ adverse: { relativeDrop: -10 } }));
  assert.equal(mutated.label, LABELS.none);
});

test("群B: window.minWeeks を上げると full が pending に変わる", () => {
  const s = subject(95); // 経過 4 週
  assert.equal(decideVerdict(s).label, LABELS.full);
  const mutated = decideVerdict(s, mergeThresholds({ window: { minWeeks: 8 } }));
  assert.equal(mutated.label, LABELS.pending);
  assert.deepEqual(
    mutated.guards.map((g) => g.code),
    ["insufficient-target"],
  );
});

// ── ガード ──────────────────────────────────────────────────────────────

test("stale-source: 固定入力 (health.json の coverage = 2026-06-16) で必ず hit する", () => {
  // 固定入力。health.json の実データを写したもの (generatedAt 2026-07-26 時点で 40 日前)
  const v = decideVerdict(
    subject(95, {
      sources: [{ name: "coverage", observedAt: "2026-06-16" }],
      now: "2026-07-26T14:08:33.008Z",
    }),
  );
  assert.equal(v.label, LABELS.pending, "40 日前の source を根拠に full を確定させてはならない");
  const guard = v.guards.find((g) => g.code === "stale-source");
  assert.ok(guard, `stale-source が出ていない: ${JSON.stringify(v.guards)}`);
  assert.match(guard.detail, /coverage=stale@2026-06-16/);
  assert.match(guard.detail, /maxSourceAgeDays 10日/);
});

test("stale-source: 実 health.json を渡した freshness が classifyAge と一致する", () => {
  const health = JSON.parse(
    fs.readFileSync(path.join(PROJECT_ROOT, ".claude/state/search-growth/health.json"), "utf8"),
  );
  const cov = health.sources?.coverage;
  assert.ok(cov, "health.json に coverage source が無い (契約変更)");
  const now = health.generatedAt;
  const expected = classifyAge({
    observedAt: cov.observedAt,
    now,
    staleAfterDays: DEFAULT_THRESHOLDS.freshness.maxSourceAgeDays,
  });
  const v = decideVerdict(
    subject(95, { sources: [{ name: "coverage", observedAt: cov.observedAt }], now }),
  );
  assert.equal(v.evidence.sources[0].freshness, expected, "engine が freshness.mjs を通していない");
  assert.equal(v.label, expected === "fresh" ? LABELS.full : LABELS.pending);
});

test("stale-source: fresh な source だけならガードは出ない", () => {
  const v = decideVerdict(subject(95));
  assert.equal(v.evidence.sources[0].freshness, "fresh");
  assert.deepEqual(v.guards, []);
});

test("insufficient-target: 想定効果値が無ければ確定しない", () => {
  const v = decideVerdict(subject(95, { target: null }));
  assert.equal(v.label, LABELS.pending);
  assert.equal(v.attainment, null);
  assert.match(v.guards[0].detail, /想定効果値/);
});

test("insufficient-target: 判定窓 (minWeeks) 未達なら確定しない", () => {
  const v = decideVerdict(subject(95, { window: { beforeWeek: "2026-W29", afterWeek: "2026-W30" } }));
  assert.equal(v.label, LABELS.pending);
  assert.match(v.guards[0].detail, /判定窓が不足 \(経過 1 週 < window\.minWeeks 2\)/);
});

test("insufficient-sample: 相対変化が noise floor 未満なら確定しない", () => {
  const v = decideVerdict(
    subject(1, { before: { value: 100, impressions: 500 }, after: { value: 101, impressions: 500 } }),
  );
  assert.equal(v.label, LABELS.pending);
  assert.match(v.guards[0].detail, /相対変化 1\.0% < sample\.minRelativeDelta 5\.0%/);
});

test("confounded: 同時投入 / 後発汚染があれば確定しない", () => {
  const v = decideVerdict(
    subject(95, { confounders: { coDeployed: ["ADSENSE-X-01"], laterContaminators: ["ADSENSE-Y-02@2026-W29"] } }),
  );
  assert.equal(v.label, LABELS.pending);
  const guard = v.guards.find((g) => g.code === "confounded");
  assert.match(guard.detail, /同時投入: ADSENSE-X-01/);
  assert.match(guard.detail, /後発投入: ADSENSE-Y-02@2026-W29/);
});

test("ガードは達成率より優先される (full 相当でも pending)", () => {
  const v = decideVerdict(subject(95, { sources: [{ name: "psi", observedAt: "2026-01-01" }] }));
  assert.equal(v.label, LABELS.pending);
  assert.equal(v.attainment, 0.95, "達成率自体は evidence として残す");
});

test("guard code は 4 種に固定されている", () => {
  assert.deepEqual(GUARD_CODES, [
    "insufficient-sample",
    "stale-source",
    "confounded",
    "insufficient-target",
  ]);
});

// ── thresholds SSOT ────────────────────────────────────────────────────

test("DEFAULT_THRESHOLDS は deep freeze されており書き換えられない", () => {
  assert.throws(() => {
    DEFAULT_THRESHOLDS.attainment.full = 0;
  }, TypeError);
  assert.equal(DEFAULT_THRESHOLDS.attainment.full, 0.8);
});

test("mergeThresholds は元を壊さず新しい frozen セットを返す", () => {
  const m = mergeThresholds({ attainment: { full: 0.5 } });
  assert.equal(m.attainment.full, 0.5);
  assert.equal(m.attainment.partial, 0.3, "指定しなかった値は base を引き継ぐ");
  assert.equal(DEFAULT_THRESHOLDS.attainment.full, 0.8, "base が壊れていない");
  assert.ok(Object.isFrozen(m) && Object.isFrozen(m.attainment));
});

test("engine の閾値リテラル直書きが無い (数値は thresholds.mjs だけに置く)", () => {
  const src = fs.readFileSync(
    path.join(PROJECT_ROOT, ".claude/scripts/lib/effect-verdict/engine.mjs"),
    "utf8",
  );
  for (const lit of ["0.8", "0.3", "-0.1", "100"]) {
    assert.ok(
      !new RegExp(`[=><]=?\\s*${lit.replace(".", "\\.")}\\b`).test(src),
      `engine.mjs に閾値リテラル ${lit} の比較が書かれている`,
    );
  }
});

// ── confounder / deploy 日 / target 抽出 ───────────────────────────────

test("detectConfounders: ±coDeployWeeks を同時投入、after 窓までの後発を汚染として返す", () => {
  const siblings = [
    { id: "A", deployWeek: "2026-W26" },
    { id: "B", deployWeek: "2026-W27" }, // ±1 週 → 同時投入
    { id: "C", deployWeek: "2026-W29" }, // after 窓内 → 汚染
    { id: "D", deployWeek: "2026-W40" }, // after より後 → 無関係
  ];
  const c = detectConfounders({
    subject: { id: "A", deployWeek: "2026-W26" },
    siblings,
    afterWeek: "2026-W30",
  });
  assert.deepEqual(c.coDeployed, ["B"]);
  assert.deepEqual(c.laterContaminators, ["B@2026-W27", "C@2026-W29"]);
});

test("detectConfounders: coDeployWeeks=0 を注入すると同時投入が消える", () => {
  const c = detectConfounders(
    {
      subject: { id: "A", deployWeek: "2026-W26" },
      siblings: [{ id: "B", deployWeek: "2026-W27" }],
      afterWeek: null,
    },
    mergeThresholds({ confounding: { coDeployWeeks: 0 } }),
  );
  assert.deepEqual(c.coDeployed, []);
});

test("extractDeployDate: deployed / デプロイ済 / 実装済 を拾い、未稼働表現は null", () => {
  assert.equal(extractDeployDate("deployed 2026-07-03。rootMargin 600px化"), "2026-07-03");
  assert.equal(extractDeployDate("実装済 2026-07-05。重複slot解消"), "2026-07-05");
  assert.equal(extractDeployDate("デプロイ済（2026-06-14）"), "2026-06-14");
  assert.equal(extractDeployDate("管理画面で unit を発行する。slotId を記入するまで非描画"), null);
  assert.equal(extractDeployDate("未デプロイ 2026-07-03"), null);
  assert.equal(extractDeployDate("2026-07-03 に何かした"), null, "deploy 語が無ければ拾わない");
});

test("extractTarget: [target: ±N unit] 形式だけを拾う (散文から推測しない)", () => {
  assert.deepEqual(extractTarget("CTR 改修 [target: +100 clicks]"), { value: 100, unit: "clicks" });
  assert.deepEqual(extractTarget("[target: -0.15]"), { value: -0.15, unit: null });
  assert.equal(extractTarget("想定効果: モバイル RPM ¥30 → ¥50+"), null);
  assert.equal(extractTarget(""), null);
});

// ── ISO 週 ─────────────────────────────────────────────────────────────

test("isoWeekOf: Date と YYYY-MM-DD の両方を受け、既存実装と同じ週を返す", () => {
  assert.equal(isoWeekOf("2026-05-23"), "2026-W21");
  assert.equal(isoWeekOf(new Date("2026-05-23T00:00:00Z")), "2026-W21");
  assert.equal(isoWeekOf("2026-07-30"), "2026-W31");
  assert.equal(isoWeekOf("2026-01-01"), "2026-W01");
  assert.equal(isoWeekOf("2025-12-29"), "2026-W01", "年境界 (月曜が翌年 W01)");
});

test("weekDiff / weekLt / weekIndex", () => {
  assert.equal(weekDiff("2026-W26", "2026-W30"), 4);
  assert.equal(weekDiff("2025-W51", "2026-W03"), 4);
  assert.equal(weekLt("2026-W09", "2026-W10"), true);
  assert.equal(weekLt("2026-W30", "2026-W30"), false);
  assert.equal(weekIndex("2026-W30"), 202630);
  assert.throws(() => weekIndex("2026-30"), /ISO 週ではない/);
});

// ── section upsert ─────────────────────────────────────────────────────

test("upsertSection: 最初の ## の直前に挿入する", () => {
  const log = "# ログ\n\n注記\n\n## [B]\n\n古い\n";
  const out = upsertSection(log, "[A]", "## [A]\n\n新しい\n");
  assert.match(out, /^# ログ\n\n注記\n\n## \[A\]\n\n新しい\n\n## \[B\]/);
});

test("upsertSection: 既存 section を置換し、冪等である", () => {
  const log = "# ログ\n\n## [A]\n\n旧\n\n## [B]\n\nB\n";
  const once = upsertSection(log, "[A]", "## [A]\n\n新\n");
  assert.ok(once.includes("## [A]\n\n新"));
  assert.ok(!once.includes("旧"));
  assert.ok(once.includes("## [B]\n\nB"), "他 section を壊さない");
  assert.equal(upsertSection(once, "[A]", "## [A]\n\n新\n"), once, "2 回 upsert しても同じ");
});

test("upsertSection: 見出しが 1 つも無いログ (新規ファイル) でも動く", () => {
  const log = "# GA4 改善ログ\n\n一覧の真実源は backlog。\n";
  const out = upsertSection(log, "[X-01]", "## [X-01]\n\n本文\n");
  assert.equal(out, "# GA4 改善ログ\n\n一覧の真実源は backlog。\n\n## [X-01]\n\n本文\n");
});

test("upsertSection: 空文字ログでも section だけを返す", () => {
  assert.equal(upsertSection("", "[X]", "本文"), "## [X]\n\n本文\n");
});

test("upsertSection: header を省いた md には自動で見出しを付ける", () => {
  const out = upsertSection("# L\n", "[Y]", "- 判定: effect/none\n");
  assert.ok(out.includes("## [Y]\n\n- 判定: effect/none\n"));
});

// ── improvement-log 判定セクション ────────────────────────────────────

test("formatVerdictSection: 判定 / 根拠データ / 閾値 SSOT / ガード / 再現コマンドを必ず出す", () => {
  const v = decideVerdict(subject(95));
  const md = formatVerdictSection(v, {
    subjectId: "TEST-01",
    metricLabel: "clicks",
    reproduceCommand: "node x.mjs --wave TEST",
    decidedAt: "2026-07-30",
  });
  for (const marker of ["[判定]", "[根拠データ]", "[閾値 SSOT]", "[ガード]", "[再現コマンド]"]) {
    assert.ok(md.includes(marker), `${marker} が無い`);
  }
  assert.ok(md.includes("effect/full"));
  assert.ok(md.includes("thresholds.mjs` v1.0.0"));
  assert.ok(md.includes("clicks 20→115"));
  assert.ok(md.includes("なし (4 ガードすべて通過)"));
});

// ── verdict CLI (adapter 横断ランナー) ───────────────────────────────

test("runAdapter: adapter 契約経由で確定ラベルが verdict 行になる", async () => {
  const { runAdapter } = await import("../effect-verdict/cli.mjs");
  const fake = {
    domainId: "fake",
    logPath: "/tmp/fake-log.md",
    headerPrefix: "FAKE-",
    listSubjects: () => [{ id: "FAKE-01", subjectId: "FAKE-01" }],
    resolveWindow: () => ({
      beforeWeek: "2026-W26",
      afterWeek: "2026-W30",
      elapsedWeeks: 4,
      notDue: false,
    }),
    measure: (_s, week) =>
      week === "2026-W26" ? { value: 20, impressions: 500 } : { value: 115, impressions: 500 },
    targetOf: () => 100,
    sourcesOf: () => [{ name: "fake", freshness: "fresh", observedAt: "2026-07-26" }],
    confoundersOf: () => ({ coDeployed: [], laterContaminators: [] }),
    pastEffectKeys: () => ["/blog/x"],
    reproduceCommand: () => "node fake.mjs",
  };
  const rows = runAdapter(fake);
  assert.equal(rows.length, 1);
  assert.equal(rows[0].label, LABELS.full);
  assert.equal(rows[0].attainment, 0.95);
  assert.deepEqual(rows[0].pastEffectKeys, ["/blog/x"]);
  assert.equal(rows[0].reproduceCommand, "node fake.mjs");
  assert.equal(rows[0].skipped, false);
});

test("runAdapter: 計測窓が解決できない subject は pending として記録する (黙って落とさない)", async () => {
  const { runAdapter } = await import("../effect-verdict/cli.mjs");
  const rows = runAdapter({
    domainId: "fake",
    logPath: "/tmp/x.md",
    headerPrefix: "",
    listSubjects: () => [{ id: "NOWINDOW-01" }],
    resolveWindow: () => ({ beforeWeek: null, afterWeek: null, elapsedWeeks: null, notDue: true }),
    measure: () => ({ value: 0, impressions: 0 }),
    targetOf: () => null,
  });
  assert.equal(rows[0].label, LABELS.pending);
  assert.equal(rows[0].skipped, true);
});

test("CLI: verdict JSON を書き、summary と thresholdsVersion を含む", () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "verdict-cli-"));
  const out = path.join(dir, "verdicts.json");
  try {
    execFileSync(
      "node",
      [path.join(PROJECT_ROOT, ".claude/scripts/lib/effect-verdict/cli.mjs"), "--week", "2026-W31", "--out", out],
      { encoding: "utf-8" },
    );
    const j = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.equal(j.schemaVersion, 1);
    assert.equal(j.week, "2026-W31");
    assert.equal(j.thresholdsVersion, THRESHOLDS_VERSION);
    assert.equal(j.thresholdsPath, ".claude/scripts/lib/effect-verdict/thresholds.mjs");
    assert.ok(j.verdicts.length > 0, "実データで verdict が 1 件も出ていない");
    assert.equal(j.summary.total, j.verdicts.length);
    for (const v of j.verdicts) {
      assert.ok(v.subjectId && v.label && v.domainId);
      assert.ok(Object.prototype.hasOwnProperty.call(v, "guards"));
      assert.ok(Object.prototype.hasOwnProperty.call(v, "sources"));
      assert.ok(Object.prototype.hasOwnProperty.call(v, "before"));
      assert.ok(Object.prototype.hasOwnProperty.call(v, "after"));
    }
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
});

test("formatVerdictSection: 原因・外部仕様を出力しない (engine の制約)", () => {
  const v = decideVerdict(subject(-30));
  const md = formatVerdictSection(v, {
    subjectId: "TEST-02",
    reproduceCommand: "node x.mjs",
    decidedAt: "2026-07-30",
  });
  for (const ng of ["のはず", "と思われる", "Google の仕様", "浸透待ち", "だろう", "と考えられる", "原因は"]) {
    assert.ok(!md.includes(ng), `NG ワード「${ng}」が出力に混入`);
  }
});
