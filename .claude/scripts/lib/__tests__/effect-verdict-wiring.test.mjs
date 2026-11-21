/**
 * 効果判定の週次ランナー (effect-verdict/cli.mjs)・過去の効果の台帳 writer (write-past-effects.mjs)・
 * triage-matrix を、.claude に残る入口から起動して確かめる。
 * packages は .claude を起動もしないので、入口を spawn する検査はここに置く
 * (packages/ops/src/effect-verdict/__tests__/{effect-verdict-cli,write-past-effects}.test.mjs から分けた。assert は変えていない)。
 *
 * 実行: node --test .claude/scripts/lib/__tests__/effect-verdict-wiring.test.mjs
 */
import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import { THRESHOLDS_VERSION } from "../../../../packages/ops/src/effect-verdict/thresholds.mjs";

// __tests__ → lib → scripts → .claude → repo root
const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..", "..");
// ★fixture の deployed_at を書いた日に時刻を固定する。
//   実時刻を使うと「deployed 2026-07-28 = まだ 2 日」が日が経つと 15 日になり、
//   書いた日を過ぎた瞬間に必ず落ちる時限テストになる (2026-08-12 に実際に落ちた)。
const FIXED_TODAY = "2026-07-30T00:00:00Z";
const MATRIX = path.join(PROJECT_ROOT, ".claude/scripts/lib/triage-matrix.mjs");
const WRITER = path.join(PROJECT_ROOT, ".claude/scripts/lib/write-past-effects.mjs");

const FIXTURE = `---
title: fixture
---

# 改善バックログ

## Tier 1 (P0/P1)

| ID | タイトル | Status | Due | Owner | Metric |
|---|---|---|---|---|---|
| FIX-OVERDUE-01 | deployed 2026-06-14。判定待ちのまま放置 | pending | 2026-09-30 | claude | adsense |
| FIX-FRESH-02 | deployed 2026-07-28。まだ 2 日 | pending | 2026-09-30 | claude | adsense |
| FIX-NONE-03 | \`/blog/price-index-high-low-prefecture\` の title 改修は効かなかった | effect/none | 2026-07-01 | claude | gsc |
| FIX-ADVERSE-04 | \`device-regression::Desktop\` の枠追加は悪化した | effect/adverse | 2026-07-01 | claude | adsense |
| FIX-NOKEY-05 | 対象 URL を書いていない施策 | effect/none | 2026-07-01 | claude | gsc |
| FIX-TYPED-06 | \`ctr-opportunity::/ranking/annual-sunshine-duration\` は効かなかった | effect/none | 2026-07-01 | claude | gsc |
`;

function withFixture(fn) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "past-effects-test-"));
  const backlog = path.join(dir, "backlog.md");
  fs.writeFileSync(backlog, FIXTURE);
  try {
    return fn({ dir, backlog });
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
}

// ── verdict CLI (adapter 横断ランナー) ───────────────────────────────

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

test("triage-matrix の超過バケットが 0 以外になる (フィールド追加で動き出す)", () => {
  withFixture(({ backlog }) => {
    const out = execFileSync("node", [MATRIX, "--format", "matrix"], {
      encoding: "utf-8",
      env: { ...process.env, IMPROVEMENT_BACKLOG_PATH: backlog, IMPROVEMENT_TODAY: FIXED_TODAY },
    });
    // | 1 | 今週 | 来週 | 来来週 | 超過 | 未定 |
    const row = out.split("\n").find((l) => /^\| 1 \|/.test(l));
    assert.ok(row, `Tier 1 行が無い:\n${out}`);
    const cells = row.split("|").map((c) => c.trim()).filter(Boolean);
    assert.equal(cells[4], "1", `超過バケットが 0 のまま: ${row}`);
    assert.match(out, /FIX-OVERDUE-01.*deployed 2026-06-14, 46d/);
  });
});

test("CLI: 2 台帳を書き、既存の note / source を保持する", () => {
  withFixture(({ dir, backlog }) => {
    const sgOut = path.join(dir, "search-growth.json");
    const adOut = path.join(dir, "adsense.json");
    fs.writeFileSync(sgOut, JSON.stringify({ note: "既存note", source: "既存source", urls: { "/old": "none" } }));
    execFileSync("node", [WRITER, "--backlog", backlog, "--search-growth-out", sgOut, "--adsense-out", adOut, "--history", path.join(dir, "no-history.json")], {
      encoding: "utf-8",
    });
    const sg = JSON.parse(fs.readFileSync(sgOut, "utf8"));
    assert.equal(sg.note, "既存note", "note を書き換えない");
    assert.equal(sg.source, "既存source");
    assert.ok(!("/old" in sg.urls), "urls は差し替える (バックログが真実源)");
    assert.equal(sg.urls["/blog/price-index-high-low-prefecture"], "none");
    const ad = JSON.parse(fs.readFileSync(adOut, "utf8"));
    assert.equal(ad.candidates["device-regression::Desktop"], "adverse");
    assert.match(ad.note, /adsense-diagnostics|AdSense/);
  });
});

test("CLI: --dry-run は書き込まない", () => {
  withFixture(({ dir, backlog }) => {
    const sgOut = path.join(dir, "sg-dry.json");
    execFileSync("node", [WRITER, "--dry-run", "--backlog", backlog, "--search-growth-out", sgOut, "--adsense-out", path.join(dir, "ad-dry.json")], {
      encoding: "utf-8",
    });
    assert.equal(fs.existsSync(sgOut), false);
  });
});

test("CLI: effect/none|adverse が 0 件でも正常終了して空台帳を書く", () => {
  withFixture(({ dir }) => {
    const backlog = path.join(dir, "empty.md");
    fs.writeFileSync(
      backlog,
      "# b\n\n## Tier 1\n\n| ID | タイトル | Status | Due | Owner | Metric |\n|---|---|---|---|---|---|\n| A-01 | 何か | pending | 2026-09-30 | claude | gsc |\n",
    );
    const sgOut = path.join(dir, "sg-empty.json");
    const adOut = path.join(dir, "ad-empty.json");
    const out = execFileSync("node", [WRITER, "--backlog", backlog, "--search-growth-out", sgOut, "--adsense-out", adOut], {
      encoding: "utf-8",
    });
    assert.match(out, /effect\/none\|adverse の行は 0 件/);
    assert.deepEqual(JSON.parse(fs.readFileSync(sgOut, "utf8")).urls, {});
    assert.deepEqual(JSON.parse(fs.readFileSync(adOut, "utf8")).candidates, {});
  });
});

test("実 backlog に対して writer が正常終了する (現在 0 件)", () => {
  const out = execFileSync("node", [WRITER, "--dry-run"], { encoding: "utf-8" });
  assert.match(out, /# past-effects 台帳 writer/);
  assert.match(out, /search-growth: \d+ key/);
});
