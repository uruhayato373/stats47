/**
 * ai-content run report (Gemini 日次 CI / ローカル claude CLI batch 共通) を長期指標と最新ダイジェストに変換する。
 *
 * 入力: generate-parallel.ts --report の JSON (本文・prompt・API key は含まない)
 * 出力: .claude/state/metrics/ai-content/{history.csv,LATEST.md}
 * 同一 run_id は upsert し、workflow rerun で二重記録しない。
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const HEADER = [
  "date",
  "run_id",
  "model",
  "targets",
  "passed",
  "rejected",
  "failed",
  "skipped",
  "author_requests",
  "critic_requests",
  "input_tokens",
  "output_tokens",
  "thinking_tokens",
  "total_tokens",
  "quota_failures",
  "preflight_requests",
  "preflight_status",
  // 末尾に追加 (既存行は空欄で読める)。API 換算費用。claude CLI の total_cost_usd 合計、gemini-api は 0。
  // Pro/Max OAuth で回した run では実請求ではない (換算値)。
  "cost_usd",
].join(",");

function csvCell(value) {
  const text = String(value ?? "");
  return /[",\n]/.test(text) ? `"${text.replaceAll('"', '""')}"` : text;
}

function parseRows(csv) {
  const lines = csv.trim().split(/\r?\n/).filter(Boolean);
  if (lines.length <= 1) return [];
  return lines.slice(1).map((line) => {
    const cells = line.split(",");
    return Object.fromEntries(HEADER.split(",").map((name, index) => [name, cells[index] ?? ""]));
  });
}

function toRow(report, preflightReport, runId) {
  if (report && (report.version !== 1 || !report.counters || !report.usage || !report.requests)) {
    throw new Error("unsupported or incomplete Gemini run report");
  }
  if (preflightReport && preflightReport.version !== 1) {
    throw new Error("unsupported Gemini preflight report");
  }
  if (!report && !preflightReport) throw new Error("Gemini run or preflight report is required");
  const base = report ?? {
    completedAt: preflightReport.completedAt,
    resolvedModel: preflightReport.resolvedModel ?? preflightReport.model,
    targets: preflightReport.targets ?? 0,
    counters: {
      ok: 0,
      rejected: 0,
      fail: 0,
      skip: preflightReport.targets ?? 0,
    },
    requests: { author: 0, critic: 0 },
    usage: { inputTokens: 0, outputTokens: 0, thinkingTokens: 0, totalTokens: 0 },
    results: [],
  };
  const generatedQuotaFailures = (base.results ?? []).filter(
    (result) => result.reason === "gemini-rate-limit" || result.reason === "gemini-billing",
  ).length;
  const preflightQuotaFailure = ["billing", "rate-limit"].includes(
    preflightReport?.classification ?? "",
  )
    ? 1
    : 0;
  const preflightUsage = preflightReport?.usage ?? {};
  return {
    date: String(base.completedAt ?? preflightReport?.completedAt ?? new Date().toISOString()).slice(0, 10),
    run_id: runId,
    model: base.resolvedModel ?? base.model ?? "unknown",
    targets: base.targets ?? 0,
    passed: base.counters.ok ?? 0,
    rejected: base.counters.rejected ?? 0,
    failed: base.counters.fail ?? 0,
    skipped: base.counters.skip ?? 0,
    author_requests: base.requests.author ?? 0,
    critic_requests: base.requests.critic ?? 0,
    input_tokens: (base.usage.inputTokens ?? 0) + (preflightUsage.inputTokens ?? 0),
    output_tokens: (base.usage.outputTokens ?? 0) + (preflightUsage.outputTokens ?? 0),
    thinking_tokens: (base.usage.thinkingTokens ?? 0) + (preflightUsage.thinkingTokens ?? 0),
    total_tokens: (base.usage.totalTokens ?? 0) + (preflightUsage.totalTokens ?? 0),
    quota_failures: generatedQuotaFailures + preflightQuotaFailure,
    preflight_requests: preflightReport?.requests ?? base.requests.preflight ?? 0,
    preflight_status: preflightReport?.ok
      ? "ok"
      : (preflightReport?.classification ?? (report ? "not-recorded" : "unknown")),
    cost_usd: Number((base.usage.costUsd ?? 0).toFixed(4)),
  };
}

function serializeRows(rows) {
  const names = HEADER.split(",");
  return `${HEADER}\n${rows.map((row) => names.map((name) => csvCell(row[name])).join(",")).join("\n")}\n`;
}

function latestMarkdown(row) {
  const attempted = Number(row.targets);
  const passed = Number(row.passed);
  const rate = attempted > 0 ? `${((passed / attempted) * 100).toFixed(1)}%` : "n/a";
  return `# Ranking AI content / latest run\n\n` +
    `- 更新日: ${row.date}\n` +
    `- run: ${row.run_id} (GitHub Actions run id、またはローカル batch の local-<date>-<time>)\n` +
    `- モデル: ${row.model}\n` +
    `- 対象: ${row.targets} / PASS: ${row.passed} / REJECT: ${row.rejected} / FAIL: ${row.failed} / SKIP: ${row.skipped}\n` +
    `- 通過率: ${rate}\n` +
    `- APIリクエスト: author ${row.author_requests} / critic ${row.critic_requests}\n` +
    `- Preflight: ${row.preflight_status} / requests ${row.preflight_requests}\n` +
    `- トークン: input ${row.input_tokens} / output ${row.output_tokens} / thinking ${row.thinking_tokens} / total ${row.total_tokens}\n` +
    `- quota/billing 停止: ${row.quota_failures}\n` +
    `- 費用 (API 換算。OAuth 実行では実請求ではない): $${row.cost_usd}\n\n` +
    `> 生成本文と prompt は記録しません。詳細履歴は [history.csv](./history.csv) を参照してください。\n`;
}

export function recordGeminiRun({ report, preflightReport, runId, historyPath, latestPath }) {
  if (!runId) throw new Error("runId is required");
  const row = toRow(report, preflightReport, runId);
  const existing = existsSync(historyPath) ? parseRows(readFileSync(historyPath, "utf8")) : [];
  const rows = [...existing.filter((item) => item.run_id !== runId), row];
  mkdirSync(dirname(historyPath), { recursive: true });
  mkdirSync(dirname(latestPath), { recursive: true });
  writeFileSync(historyPath, serializeRows(rows));
  writeFileSync(latestPath, latestMarkdown(row));
  return row;
}

function argValue(argv, name) {
  const index = argv.indexOf(name);
  return index >= 0 ? argv[index + 1] : undefined;
}

function main() {
  const argv = process.argv.slice(2);
  const reportPath = argValue(argv, "--report");
  const preflightReportPath = argValue(argv, "--preflight-report");
  const runId = argValue(argv, "--run-id") ?? process.env.GITHUB_RUN_ID;
  const outputDir = argValue(argv, "--out-dir") ?? ".claude/state/metrics/ai-content";
  if (!reportPath && !preflightReportPath) {
    throw new Error("--report or --preflight-report is required");
  }
  if (!runId) throw new Error("--run-id or GITHUB_RUN_ID is required");
  const report = reportPath && existsSync(reportPath)
    ? JSON.parse(readFileSync(reportPath, "utf8"))
    : undefined;
  const preflightReport = preflightReportPath && existsSync(preflightReportPath)
    ? JSON.parse(readFileSync(preflightReportPath, "utf8"))
    : undefined;
  const row = recordGeminiRun({
    report,
    preflightReport,
    runId,
    historyPath: join(outputDir, "history.csv"),
    latestPath: join(outputDir, "LATEST.md"),
  });
  process.stdout.write(`[record-gemini-run] run ${row.run_id}: PASS ${row.passed}/${row.targets}\n`);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  try {
    main();
  } catch (error) {
    process.stderr.write(`[record-gemini-run] ${error instanceof Error ? error.message : String(error)}\n`);
    process.exit(1);
  }
}
