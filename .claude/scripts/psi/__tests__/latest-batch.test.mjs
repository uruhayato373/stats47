import assert from "node:assert/strict";
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import test from "node:test";

import { findLatestPsiBatch, loadLatestPsiBatch } from "../lib/latest-batch.mjs";
import { datasetDir } from "../../../../config/datasets.mjs";

test("生 PSI の置き場は R2 state/psi/ の手元の写しと同じ git 管理外の live/ である", () => {
  assert.equal(datasetDir("psi.batch"), "data/psi/live");
});

test("名前の新しい psi-batch を選び、state:pull --latest で取った latest.json の方が新しければそちらを選ぶ", () => {
  const dir = mkdtempSync(join(tmpdir(), "stats47-psi-batch-"));
  assert.equal(findLatestPsiBatch(join(dir, "missing")), null);
  assert.equal(findLatestPsiBatch(dir), null);

  writeFileSync(join(dir, "psi-batch-2026-11-06T21-43-19.json"), JSON.stringify({ generated_at: "2026-11-06T21:43:19.500Z", results: [{ url: "a" }] }));
  writeFileSync(join(dir, "psi-batch-2026-10-30T21-00-00.json"), JSON.stringify({ generated_at: "2026-10-30T21:00:00.000Z", results: [] }));
  assert.equal(basename(findLatestPsiBatch(dir) ?? ""), "psi-batch-2026-11-06T21-43-19.json");

  // 同じ回の latest.json は psi-batch と同じ中身なので、どちらを選んでも結果は同じ。古い latest.json は選ばない
  writeFileSync(join(dir, "latest.json"), JSON.stringify({ generated_at: "2026-11-06T21:43:19.500Z", results: [] }));
  assert.equal(basename(findLatestPsiBatch(dir) ?? ""), "psi-batch-2026-11-06T21-43-19.json");

  writeFileSync(join(dir, "latest.json"), JSON.stringify({ generated_at: "2026-11-13T22:10:00.000Z", results: [{ url: "b" }] }));
  assert.equal(basename(findLatestPsiBatch(dir) ?? ""), "latest.json");
  const batch = loadLatestPsiBatch(dir);
  assert.equal(batch.generated_at, "2026-11-13T22:10:00.000Z");
  assert.deepEqual(batch.results, [{ url: "b" }]);
});

test("生 PSI が 1 件も無ければ取得の手順を添えて止まる", () => {
  const dir = mkdtempSync(join(tmpdir(), "stats47-psi-batch-"));
  assert.throws(() => loadLatestPsiBatch(dir), /state:pull -- psi/);
});
