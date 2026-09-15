import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { mkdtempSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";

import {
  RETENTION_POLICIES,
  pruneScope,
  selectSnapshotsToPrune,
} from "../prune-state-snapshots.mjs";

test("辞書順で古い snapshot だけを選び、LATEST/history は触らない", () => {
  const files = [
    "LATEST.md",
    "history.csv",
    "psi-batch-2026-08-02T00-00-00.json",
    "psi-batch-2026-08-01T00-00-00.json",
    "psi-batch-invalid.json",
  ];
  assert.deepEqual(
    selectSnapshotsToPrune(files, RETENTION_POLICIES.psi.pattern, 1),
    ["psi-batch-2026-08-01T00-00-00.json"],
  );
});

test("scope外の state を削除しない", () => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-retention-"));
  const directory = join(root, RETENTION_POLICIES.gsc.directory);
  mkdirSync(directory, { recursive: true });
  for (let day = 1; day <= 9; day++) {
    writeFileSync(join(directory, `2026-08-${String(day).padStart(2, "0")}.csv`), "x");
  }
  writeFileSync(join(directory, "history.csv"), "history");
  writeFileSync(join(directory, "LATEST.md"), "latest");

  const result = pruneScope("gsc", { root });
  assert.deepEqual(result.removed, ["2026-08-01.csv", "2026-08-02.csv"]);
  assert.deepEqual(readdirSync(directory).sort(), [
    "2026-08-03.csv",
    "2026-08-04.csv",
    "2026-08-05.csv",
    "2026-08-06.csv",
    "2026-08-07.csv",
    "2026-08-08.csv",
    "2026-08-09.csv",
    "LATEST.md",
    "history.csv",
  ]);
});

test("keep=0 を拒否して全削除を防ぐ", () => {
  assert.throws(
    () => selectSnapshotsToPrune(["2026-08-01.csv"], /\.csv$/, 0),
    /1以上/,
  );
});

test("ディレクトリ scope はディレクトリごと消し、存在しない scope は空扱い", () => {
  const root = mkdtempSync(join(tmpdir(), "stats47-state-retention-dir-"));
  const directory = join(root, RETENTION_POLICIES["analytics-gsc"].directory);
  mkdirSync(directory, { recursive: true });
  for (let week = 1; week <= 28; week++) {
    const dir = join(directory, `2026-W${String(week).padStart(2, "0")}`);
    mkdirSync(dir);
    writeFileSync(join(dir, "queries.csv"), "q");
  }
  writeFileSync(join(directory, "README.md"), "keep");
  const result = pruneScope("analytics-gsc", { root });
  assert.deepEqual(result.removed, ["2026-W01", "2026-W02"]);
  assert.equal(readdirSync(directory).length, 27);
  assert.ok(readdirSync(directory).includes("README.md"));
  assert.deepEqual(pruneScope("releases", { root }).removed, []);
});

// 日付名で増え続ける state は「どの policy が消すか」を宣言していなければ追跡させない。
// 例外は (a) 人手 export で再生成できない恒久記録、(b) check-repo-hygiene.cjs の baseline に
// 載っている既存の直下ファイル (DATED_STATE_ARTIFACT)。新しい置き場を足すときはここか policy を更新する。
const PERMANENT_DATED_DIRS = [
  ".claude/state/metrics/gsc/coverage-drilldown", // GSC UI の手動 export (再取得不能)
  ".claude/state/metrics/note/dashboard", // note ダッシュボードの baseline
  ".claude/state/metrics/themes", // テーマ品質の週次証拠 (theme-chart-audit が参照)
  ".claude/state/metrics/prompt-evals",
  ".claude/skills/analytics/cloudflare-cost-improvement/reference/weekly-snapshots",
  ".claude/skills/analytics/ga4-improvement/reference/archive",
  ".claude/skills/analytics/gsc-improvement/reference/archive",
];

test("追跡中の日付名 state は必ず寿命 (policy / 恒久宣言 / baseline) を持つ", () => {
  const root = resolve(fileURLToPath(new URL("../../../..", import.meta.url)));
  const tracked = execFileSync(
    "git",
    ["ls-files", "-z", ".claude/state/metrics", ".claude/state/business-plan", ".claude/state/search-growth", ".claude/skills/analytics"],
    { cwd: root, encoding: "utf8" },
  )
    .split("\0")
    .filter(Boolean)
    .map((f) => f.split("\\").join("/"));
  const dated = tracked.filter((f) => /\d{4}-(\d{2}-\d{2}|W\d{2})/.test(f.split("/").at(-1)) || /\/\d{4}-W\d{2}\//.test(f));
  const inPolicy = (f) =>
    Object.values(RETENTION_POLICIES).some((p) => {
      const rel = relative(p.directory, f).split("\\").join("/");
      return !rel.startsWith("..") && p.pattern.test(rel.split("/")[0]);
    });
  const baseline = JSON.parse(readFileSync(join(root, ".claude/config/repo-hygiene-baseline.json"), "utf8"));
  const baselined = new Set(baseline.findings.filter((x) => x.code === "DATED_STATE_ARTIFACT").map((x) => x.file));
  const undeclared = dated.filter(
    (f) => !inPolicy(f) && !baselined.has(f) && !PERMANENT_DATED_DIRS.some((d) => f.startsWith(`${d}/`)),
  );
  assert.deepEqual(undeclared, [], `寿命未宣言の日付名 state: ${undeclared.slice(0, 10).join(", ")}`);
});
