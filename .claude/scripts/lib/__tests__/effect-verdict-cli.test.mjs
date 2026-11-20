/**
 * effect-verdict CLI (adapter 横断ランナー) のテスト。エンジン本体のテストは
 * packages/ops/src/effect-verdict/__tests__/effect-verdict.test.mjs。
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

import { LABELS } from "../../../../packages/ops/src/effect-verdict/engine.mjs";
import { THRESHOLDS_VERSION } from "../../../../packages/ops/src/effect-verdict/thresholds.mjs";

// __tests__ → lib → scripts → .claude → repo root
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");

// ── verdict CLI (adapter 横断ランナー) ───────────────────────────────

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
      // 判定不能のまま終了した wave (closed-waves.json) は対象外になる。ここでは空の台帳を指して実データの wave を測る
      { encoding: "utf-8", env: { ...process.env, EFFECT_VERDICT_CLOSED_WAVES: path.join(dir, "no-closures.json") } },
    );
    const j = JSON.parse(fs.readFileSync(out, "utf8"));
    assert.equal(j.schemaVersion, 1);
    assert.equal(j.week, "2026-W31");
    assert.equal(j.thresholdsVersion, THRESHOLDS_VERSION);
    assert.equal(j.thresholdsPath, "packages/ops/src/effect-verdict/thresholds.mjs");
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

test("baselineは差分や事後targetを作らず4週の充足だけを記録する", async () => {
  const { runAdapter } = await import('../effect-verdict/cli.mjs');
  const { ADSENSE_BASELINE, observeAdsenseBaseline } = await import('../../../../packages/ops/src/metrics/adsense-measurement-contract.mjs');
  const rows = ADSENSE_BASELINE.weeks.map(week => ({ week, earnings: 25, accountId: ADSENSE_BASELINE.accountId }));
  const fake = {
    domainId: 'adsense', logPath: '/tmp/test.md',
    listSubjects: () => [{ id: ADSENSE_BASELINE.subjectId }],
    observeBaseline: () => observeAdsenseBaseline(rows.slice(0, 1), '2026-10-17'),
    baselineSources: () => [{ name: 'fixture' }], reproduceCommand: () => 'fixture',
    measure: () => { throw new Error('baseline must not compare'); },
  };
  const [v] = runAdapter(fake);
  assert.equal(v.assessment.kind, 'baseline-observation');
  assert.equal(v.observation.status, 'pending');
  assert.equal(v.guards[0].code, 'insufficient-window');
  assert.equal(v.before, null);
  assert.equal(v.after, null);
  assert.equal(v.target, null);
  assert.equal(v.label, LABELS.pending);
  assert.equal(observeAdsenseBaseline(rows, '2026-11-13').status, 'ready');
  assert.equal(observeAdsenseBaseline(rows.slice(0, 1), '2026-11-13').overdue, true);
});

test("AdSense adapterは新旧口座と明示的な不一致口座の比較を拒否する", async () => {
  const { resolveAdsenseWindows } = await import('../../metrics/measure-adsense-impact.mjs');
  const { ADSENSE_BASELINE, observeAdsenseBaseline } = await import('../../../../packages/ops/src/metrics/adsense-measurement-contract.mjs');
  const rows = [
    { week: '2026-W34', earnings: 100 },
    { week: '2026-W42', earnings: 200, accountId: 'pub-wrong' },
    { week: '2026-W43', earnings: 50, accountId: ADSENSE_BASELINE.accountId },
  ];
  assert.equal(resolveAdsenseWindows('2026-W41', rows).before, null);
  assert.equal(resolveAdsenseWindows('2026-W41', rows).after, '2026-W43');
  assert.equal(resolveAdsenseWindows('2026-W33', rows).after, '2026-W34');
  assert.deepEqual(observeAdsenseBaseline(rows).observedWeeks, ['2026-W43']);
});
