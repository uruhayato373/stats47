import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const VALIDATOR = path.join(__dirname, "..", "validate-theme-state.mjs");

/** fixture: state dir + 疑似 THEME_CATALOGS index.ts を作る */
function fixture({ portfolio, experiments, catalogKeys = ["aging-society", "tourism"] } = {}) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "stats47-theme-state-"));
  const stateDir = path.join(root, "themes");
  fs.mkdirSync(stateDir, { recursive: true });
  if (portfolio) fs.writeFileSync(path.join(stateDir, "portfolio.json"), JSON.stringify(portfolio));
  if (experiments) fs.writeFileSync(path.join(stateDir, "experiments.json"), JSON.stringify(experiments));
  const idx = path.join(root, "index.ts");
  fs.writeFileSync(idx,
    `export const THEME_CATALOGS: Record<string, unknown> = {\n` +
    catalogKeys.map((k) => `  "${k}": {},`).join("\n") + `\n};\n`);
  return { root, stateDir, idx };
}

function run(f) {
  return spawnSync(process.execPath, [VALIDATOR, "--json"], {
    encoding: "utf8",
    env: { ...process.env, STATE_DIR: f.stateDir, CATALOG_INDEX: f.idx },
  });
}

const theme = (over = {}) => ({
  themeKey: "aging-society", catalogStatus: "catalog", lifecycleStatus: "keep",
  reviewStatus: "reviewed", evidenceRefs: [".claude/skills/theme/manage-theme-portfolio/reference/reviews/2026-07-11-theme-aging-society.md"],
  metrics: { gsc: { status: "measured", windowDays: 56, clicks: 120, impressions: 4300 } },
  ...over,
});

test("有効な portfolio + THEME_CATALOGS 全掲載で pass", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [theme(), theme({ themeKey: "tourism" })] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 0, r.stdout);
  assert.deepEqual(JSON.parse(r.stdout).violations, []);
});

test("state 未生成 (PR-2 前) は skip で exit 0", (t) => {
  const f = fixture({});
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  assert.equal(run(f).status, 0);
});

test("根拠なし retire-candidate を弾く (P3/P4)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [
      theme({ lifecycleStatus: "retire-candidate", evidenceRefs: ["one-only"],
              metrics: { gsc: { status: "insufficient-data" } } }),
      theme({ themeKey: "tourism" }),
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  const codes = JSON.parse(r.stdout).violations.join("\n");
  assert.match(codes, /\[P3\]/); // evidenceRefs < 2
  assert.match(codes, /\[P4\]/); // measured 56d なし
});

test("非 measured metrics に数値が混入したら弾く (P5・推測値の保存禁止)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [
      theme({ metrics: { gsc: { status: "insufficient-data", clicks: 5 } } }),
      theme({ themeKey: "tourism" }),
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).violations.join("\n"), /\[P5\]/);
});

test("THEME_CATALOGS との不一致を弾く (P2: 欠落 + catalogStatus 齟齬)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [theme({ catalogStatus: "legacy" })] }, // tourism 欠落 + aging を legacy 誤記
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout).violations.join("\n");
  assert.match(out, /aging-society.*catalogStatus=legacy/);
  assert.match(out, /tourism が portfolio に無い/);
});

test("measured-low はカウント値のみ許可・比率値は弾く (P5)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [
      theme({ metrics: { gsc: { status: "measured-low", windowDays: 56, clicks: 2, impressions: 158 } } }), // カウントのみ → OK
      theme({ themeKey: "tourism",
              metrics: { gsc: { status: "measured-low", windowDays: 56, clicks: 1, impressions: 72, ctr: 0.014 } } }), // 比率混入 → NG
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout).violations;
  assert.equal(out.filter((x) => x.includes("aging-society")).length, 0); // カウントのみは無違反
  assert.match(out.join("\n"), /tourism.*measured-low なのに比率\/非カウント値 \(ctr\)/);
});

test("retire-candidate は measured-low 両輪 (GSC+GA4 56d) + 根拠 2 で成立する (P4 改訂)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [
      theme({
        lifecycleStatus: "retire-candidate",
        evidenceRefs: [".claude/todo/04_改善バックログ.md", "56d 実測: imp 23 / pv 12 (measured-low)"],
        metrics: {
          gsc: { status: "measured-low", windowDays: 56, clicks: 0, impressions: 23 },
          ga4: { status: "measured-low", windowDays: 56, pageViews: 12 },
        },
      }),
      theme({ themeKey: "tourism" }),
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 0, r.stdout); // 集計済み低カウント = 需要不足の証拠として退役候補を許可
});

test("retire-candidate は GA4 未集計だと弾く (P4 は GSC/GA4 両輪)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [
      theme({
        lifecycleStatus: "retire-candidate",
        evidenceRefs: ["a", "b"],
        metrics: {
          gsc: { status: "measured", windowDays: 56, clicks: 10, impressions: 500 },
          ga4: { status: "insufficient-data", windowDays: 56 },
        },
      }),
      theme({ themeKey: "tourism" }),
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).violations.join("\n"), /\[P4\].*GSC\/GA4 両方/);
});

test("同一 theme×changeType の pending 重複実験を弾く (E2)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [theme(), theme({ themeKey: "tourism" })] },
    experiments: { schemaVersion: 1, experiments: [
      { experimentId: "THEME-EXP-001", themeKey: "tourism", changeType: "catalog-metrics",
        baseline: { "gsc.clicks": 10 }, verdict: "pending" },
      { experimentId: "THEME-EXP-002", themeKey: "tourism", changeType: "catalog-metrics",
        baseline: { "gsc.clicks": 10 }, verdict: "pending" },
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  assert.match(JSON.parse(r.stdout).violations.join("\n"), /\[E2\] 重複実験/);
});

test("baseline なし実験と根拠なし verdict 確定を弾く (E3)", (t) => {
  const f = fixture({
    portfolio: { schemaVersion: 1, themes: [theme(), theme({ themeKey: "tourism" })] },
    experiments: { schemaVersion: 1, experiments: [
      { experimentId: "THEME-EXP-003", themeKey: "aging-society", changeType: "copy", verdict: "pending" },
      { experimentId: "THEME-EXP-004", themeKey: "tourism", changeType: "structure",
        baseline: { "gsc.clicks": 10 }, verdict: "effect-full" }, // result/evidence なし
    ] },
  });
  t.after(() => fs.rmSync(f.root, { recursive: true, force: true }));
  const r = run(f);
  assert.equal(r.status, 1);
  const out = JSON.parse(r.stdout).violations.join("\n");
  assert.match(out, /THEME-EXP-003: baseline 欠落/);
  assert.match(out, /THEME-EXP-004: verdict=effect-full なのに result が無い/);
});
