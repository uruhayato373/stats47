import assert from "node:assert/strict";
import { mkdtempSync, mkdirSync, readdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
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
