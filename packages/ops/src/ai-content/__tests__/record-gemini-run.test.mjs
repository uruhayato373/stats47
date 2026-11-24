import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";

import { recordGeminiRun } from "../record-gemini-run.mjs";

const report = {
  version: 1,
  completedAt: "2026-08-30T01:00:00.000Z",
  model: "gemini-api",
  resolvedModel: "gemini-2.5-flash-lite",
  targets: 3,
  counters: { ok: 2, rejected: 1, fail: 0, skip: 0 },
  requests: { author: 4, critic: 3, total: 7 },
  usage: { inputTokens: 100, outputTokens: 200, thinkingTokens: 30, totalTokens: 330 },
  results: [],
};

test("history を run_id で upsert し LATEST を更新する", () => {
  const dir = mkdtempSync(join(tmpdir(), "record-gemini-run-"));
  try {
    const historyPath = join(dir, "history.csv");
    const latestPath = join(dir, "LATEST.md");
    recordGeminiRun({ report, runId: "123", historyPath, latestPath });
    recordGeminiRun({
      report: { ...report, counters: { ...report.counters, ok: 3, rejected: 0 } },
      runId: "123",
      historyPath,
      latestPath,
    });

    const history = readFileSync(historyPath, "utf8").trim().split("\n");
    assert.equal(history.length, 2, "header + 1 run only");
    assert.match(history[1], /123,gemini-2\.5-flash-lite,3,3,0/);
    assert.match(readFileSync(latestPath, "utf8"), /PASS: 3/);
    assert.doesNotMatch(readFileSync(latestPath, "utf8"), /prompt.*\{/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});

test("preflight の quota 停止だけでも履歴へ記録する", () => {
  const dir = mkdtempSync(join(tmpdir(), "record-gemini-preflight-"));
  try {
    const historyPath = join(dir, "history.csv");
    const latestPath = join(dir, "LATEST.md");
    recordGeminiRun({
      preflightReport: {
        version: 1,
        completedAt: "2026-08-30T02:00:00.000Z",
        resolvedModel: "gemini-2.5-flash-lite",
        targets: 3,
        ok: false,
        classification: "rate-limit",
        requests: 1,
        usage: { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, totalTokens: 0 },
      },
      runId: "quota-1",
      historyPath,
      latestPath,
    });

    const latest = readFileSync(latestPath, "utf8");
    assert.match(latest, /SKIP: 3/);
    assert.match(latest, /Preflight: rate-limit/);
    assert.match(latest, /quota\/billing 停止: 1/);
  } finally {
    rmSync(dir, { recursive: true, force: true });
  }
});
