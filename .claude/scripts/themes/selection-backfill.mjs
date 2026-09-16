#!/usr/bin/env node
/**
 * selection-backfill.mjs — ThemeCatalog の選定根拠 (selection) を一次資料で裏付ける backfill の CLI。
 *
 * サブコマンド (すべて `node --import tsx .claude/scripts/themes/selection-backfill.mjs <sub> ...`):
 *   targets [--theme <key>] [--json]      adoptionCriteria 未記入の非 context 指標を列挙 (残件の多い順)
 *   prompt  --theme <key> [--surveyed-at YYYY-MM-DD]
 *                                          モデルへ渡す指示を stdout へ (skill の対話経路が theme-researcher に渡す)
 *   apply   --theme <key> --input <json> [--dry-run] [--require-catalog] [--surveyed-at ...]
 *                                          モデル出力 JSON を gate に通し、通過分だけカタログへ書く。結果 JSON を stdout へ
 *   reapply [--dir <dir>] [--dry-run]     保存済みチャンク出力 (<label>.output.json) を現在の gate で再適用 (gate 修正後の回収用)
 *   run     [--themes a,b] [--limit N] [--concurrency 1-2] [--model claude-sonnet] [--effort low|medium]
 *           [--chunk-size 6] [--budget-usd 5] [--capacity-wait-min 30] [--capacity-retries 3] [--max-fail-rate 0.3]
 *           [--min-entries-for-rate 10] [--report <dir>] [--dry-run]
 *                                          headless claude CLI でテーマを並列 2 まで処理し、gate → 書き込み → report
 *
 * ★run はユーザー端末 (Claude Code 外) で実行する。セッション内では claude CLI が Keychain を読めず
 *   「Not logged in」になる (ai-content の run-claude-batch.sh と同じ制約)。セッションからは --dry-run だけ。
 * ★モデルはファイルを一切触らない (tools は WebFetch/WebSearch のみ・cwd は repo 外)。書くのはこの CLI の
 *   決定的 writer だけで、gate 未通過は書かない。role / rejectedCandidates は書かない (カードの禁止事項)。
 *
 * 正典: .claude/todo/backlog.md THEME-SELECTION-BACKFILL-01 / .claude/rules/theme-catalog-standards.md §4
 */
import { spawn } from "node:child_process";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import {
  CLAUDE_CLI_MODELS,
  ClaudeCliError,
  createUtf8Collector,
  parseClaudeCliOutput,
} from "../../../packages/ai-content/src/services/claude-cli-output.ts";
import {
  OUTPUT_SCHEMA,
  PROJECT_ROOT,
  SYSTEM_PROMPT,
  applySelections,
  attachClassNames,
  buildMarkdownReport,
  buildPrompt,
  createFetcher,
  gateEntries,
  listTargets,
  loadClassIndex,
} from "./selection-backfill-core.mjs";

const REPORT_DIR_DEFAULT = path.join(
  PROJECT_ROOT,
  ".claude/skills/theme/manage-theme-portfolio/reference/audits",
);
const LOCAL_DIR = path.join(PROJECT_ROOT, ".local/selection-backfill");
/** claude CLI の cwd。repo 外に固定して CLAUDE.md / rules / hooks を読ませない (ai-content と同じ理由) */
const CLI_CWD = path.join(os.tmpdir(), "stats47-selection-backfill-cli");

/** サーバー側の一時スロットリング (待てば通る) */
const TRANSIENT_RE = /temporarily limiting|rate limited|overloaded|529|503/i;
/** 5 時間利用枠の枯渇 (待ち時間を長く取る。3 連続で停止 = カードの停止条件) */
const CAPACITY_RE = /usage limit|limit reached|hit your limit|out of extra usage|resets at/i;
const TRANSIENT_RETRIES = 4;
const TRANSIENT_BACKOFF_MS = 60_000;

function parseArgs(argv) {
  const args = { _: [] };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a.startsWith("--")) {
      const key = a.slice(2);
      const next = argv[i + 1];
      if (next !== undefined && !next.startsWith("--")) {
        args[key] = next;
        i++;
      } else {
        args[key] = true;
      }
    } else {
      args._.push(a);
    }
  }
  return args;
}

function todayIso() {
  const d = new Date();
  const jst = new Date(d.getTime() + 9 * 3600 * 1000);
  return jst.toISOString().slice(0, 10);
}

function log(msg) {
  process.stderr.write(`[selection-backfill] ${msg}\n`);
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------------------------------------------------------------------------
// targets / prompt
// ---------------------------------------------------------------------------

function cmdTargets(args) {
  const targets = listTargets({ theme: args.theme });
  if (args.json) {
    process.stdout.write(`${JSON.stringify(targets, null, 2)}\n`);
    return;
  }
  const total = targets.reduce((a, t) => a + t.metrics.length, 0);
  console.log(`対象 ${targets.length} テーマ / ${total} 指標 (adoptionCriteria 未記入の primary/secondary)`);
  for (const t of targets) console.log(`  ${t.themeKey.padEnd(28)} ${String(t.metrics.length).padStart(3)}  ${t.themeTitle}`);
}

function loadTarget(themeKey) {
  const [target] = listTargets({ theme: themeKey });
  if (!target) throw new Error(`テーマ ${themeKey} に backfill 対象が無い (THEME_CATALOGS に無いか、全件記入済み)`);
  return attachClassNames(target, loadClassIndex());
}

function cmdPrompt(args) {
  if (!args.theme) throw new Error("--theme が必要");
  const target = loadTarget(args.theme);
  process.stdout.write(buildPrompt(target, { surveyedAt: args["surveyed-at"] ?? todayIso() }));
}

// ---------------------------------------------------------------------------
// apply (gate → write)
// ---------------------------------------------------------------------------

async function applyOutput(target, output, { surveyedAt, dryRun, requireCatalog, fetchSource }) {
  const classIndex = loadClassIndex();
  if (!classIndex && requireCatalog) {
    throw new Error("e-Stat カタログが pull されていない (--require-catalog)。node --import tsx .claude/scripts/estat/catalog.mjs pull");
  }
  const gate = await gateEntries(target, output, { fetchSource, classIndex, surveyedAt });
  const written = applySelections(target.themeKey, gate.accepted, { dryRun });
  return {
    themeKey: target.themeKey,
    targets: target.metrics.length,
    accepted: Object.keys(gate.accepted).length,
    rejected: gate.rejected.length,
    skipped: gate.skipped.length,
    untouched: gate.untouched.length,
    written,
    acceptedKeys: Object.keys(gate.accepted),
    rejectedDetail: gate.rejected,
    skippedDetail: gate.skipped,
    untouchedKeys: gate.untouched,
    roleRecommendations: gate.roleRecommendations,
    checks: gate.checks,
    classIndexAvailable: Boolean(classIndex),
    dryRun,
  };
}

async function cmdApply(args) {
  if (!args.theme || !args.input) throw new Error("--theme と --input が必要");
  const target = loadTarget(args.theme);
  const output = JSON.parse(fs.readFileSync(args.input, "utf8"));
  const result = await applyOutput(target, output, {
    surveyedAt: args["surveyed-at"] ?? todayIso(),
    dryRun: Boolean(args["dry-run"]),
    requireCatalog: Boolean(args["require-catalog"]),
    fetchSource: createFetcher(),
  });
  process.stdout.write(`${JSON.stringify(result, null, 2)}\n`);
  if (result.accepted === 0 && result.targets > 0) process.exitCode = 2;
}

/**
 * 保存済みのチャンク出力 (<label>.output.json) を現在の gate で再適用する。
 * gate を直した後に、前 run で誤って落とした entry を LLM を呼び直さずに回収する用途。
 * 書き込み済みの指標は対象から外れているので not-a-target で無視され、二重書き込みにならない。
 */
async function cmdReapply(args) {
  const dir = args.dir ?? LOCAL_DIR;
  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".output.json")).sort();
  const fetchSource = createFetcher();
  const classIndex = loadClassIndex();
  const summary = [];
  for (const file of files) {
    const themeKey = file.replace(/\.output\.json$/, "").replace(/#\d+$/, "");
    const [target] = listTargets({ theme: themeKey });
    if (!target) continue; // 全件記入済み
    attachClassNames(target, classIndex);
    const output = JSON.parse(fs.readFileSync(path.join(dir, file), "utf8"));
    const gate = await gateEntries(target, output, { fetchSource, classIndex, surveyedAt: args["surveyed-at"] ?? todayIso() });
    const written = args["dry-run"] ? { inline: [], evidence: [] } : applySelections(themeKey, gate.accepted);
    const recovered = Object.keys(gate.accepted);
    const stillRejected = gate.rejected.filter((r) => !r.reasons.includes("not-a-target"));
    summary.push({ file, recovered, stillRejected });
    log(`${file}: 回収 ${recovered.length} (${recovered.join(", ") || "-"}) / 依然不合格 ${stillRejected.length}${written.inline.length + written.evidence.length ? "" : args["dry-run"] ? " (dry-run)" : ""}`);
    for (const r of stillRejected) log(`   ✗ ${r.rankingKey}: ${r.reasons.join(", ")}`);
  }
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
}

// ---------------------------------------------------------------------------
// run (headless pool)
// ---------------------------------------------------------------------------

function childEnv() {
  const env = {};
  for (const [k, v] of Object.entries(process.env)) {
    // 親 Claude Code セッションの文脈を継がせない (継ぐと Keychain を読まず「Not logged in」)
    if (k === "NODE_OPTIONS" || k === "CLAUDECODE" || k.startsWith("CLAUDE_")) continue;
    env[k] = v;
  }
  return env;
}

/** claude CLI を 1 回呼ぶ。結果 JSON (structured_output) と usage を返す。 */
function callClaudeOnce(prompt, { model, effort, budgetUsd }) {
  return new Promise((resolve, reject) => {
    const bin = process.env.CLAUDE_CLI_BIN?.trim() || "claude";
    fs.mkdirSync(CLI_CWD, { recursive: true });
    const args = [
      "-p",
      "",
      "--output-format",
      "json",
      "--model",
      CLAUDE_CLI_MODELS[model],
      "--tools",
      "WebFetch,WebSearch",
      "--allowedTools",
      "WebFetch,WebSearch",
      "--strict-mcp-config",
      "--no-session-persistence",
      "--setting-sources",
      "local",
      "--system-prompt",
      SYSTEM_PROMPT,
      "--json-schema",
      JSON.stringify(OUTPUT_SCHEMA),
      "--effort",
      effort,
      "--max-budget-usd",
      String(budgetUsd),
    ];
    const proc = spawn(bin, args, { cwd: CLI_CWD, env: childEnv(), stdio: ["pipe", "pipe", "pipe"] });
    const out = createUtf8Collector();
    const err = createUtf8Collector();
    proc.stdout.on("data", (d) => out.push(d));
    proc.stderr.on("data", (d) => err.push(d));
    proc.on("error", (e) => reject(new Error(`spawn error: ${e.message}`)));
    proc.on("close", (code) => {
      const stdout = out.end();
      const stderr = err.end();
      if (stdout.trim()) {
        try {
          const parsed = parseClaudeCliOutput(stdout);
          resolve(parsed);
          return;
        } catch (e) {
          if (e instanceof ClaudeCliError && e.subtype !== "invalid-output") {
            reject(e);
            return;
          }
          if (code === 0) {
            reject(e);
            return;
          }
        }
      }
      reject(new Error(`claude CLI failed (code ${code}): ${stderr.slice(0, 300) || stdout.slice(0, 300)}`));
    });
    proc.stdin.write(prompt, "utf8");
    proc.stdin.end();
  });
}

/**
 * 一時スロットリングは 60s×n で再試行、利用枠の枯渇は capacityWaitMin 分待って再試行 (最大 capacityRetries)。
 * 枠エラーが上限に達したら `capacity-exhausted` を投げ、呼び元が run 全体を止める。
 */
async function callClaude(prompt, opts, state) {
  let transient = 0;
  for (;;) {
    try {
      const parsed = await callClaudeOnce(prompt, opts);
      state.capacityStrikes = 0;
      return parsed;
    } catch (e) {
      const msg = String(e?.message ?? e);
      if (CAPACITY_RE.test(msg)) {
        state.capacityStrikes += 1;
        if (state.capacityStrikes >= opts.capacityRetries) {
          const err = new Error(`capacity-exhausted: ${msg.slice(0, 200)}`);
          err.code = "capacity-exhausted";
          throw err;
        }
        log(`利用枠エラー (${state.capacityStrikes}/${opts.capacityRetries})。${opts.capacityWaitMin} 分待つ: ${msg.slice(0, 120)}`);
        await sleep(opts.capacityWaitMin * 60_000);
        continue;
      }
      if (TRANSIENT_RE.test(msg) && transient < TRANSIENT_RETRIES) {
        transient += 1;
        log(`一時スロットリング (${transient}/${TRANSIENT_RETRIES})。${transient} 分待つ`);
        await sleep(TRANSIENT_BACKOFF_MS * transient);
        continue;
      }
      throw e;
    }
  }
}

function emptyThemeResult(target) {
  return {
    themeKey: target.themeKey,
    targets: target.metrics.length,
    accepted: 0,
    rejected: 0,
    skipped: 0,
    untouched: target.metrics.length,
    status: "pending",
    usage: null,
  };
}

function chunkArray(items, size) {
  const out = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}

const EMPTY_USAGE = { inputTokens: 0, outputTokens: 0, totalTokens: 0, thinkingTokens: 0, costUsd: 0, numTurns: 0, modelId: null };

/**
 * 1 テーマを --chunk-size 指標ずつ claude に渡す (healthcare 38 指標を 1 call に載せると予算上限・
 * コンテキスト肥大で丸ごと落ちるため)。チャンクごとに gate → 書き込みまで済ませるので、
 * 途中の chunk が落ちても通過済みは残る。枠エラー (capacity-exhausted) だけは run 全体を止めるため再 throw。
 */
async function processTheme(target, opts, state) {
  const result = emptyThemeResult(target);
  if (opts.dryRun) {
    result.status = "dry-run";
    result.untouched = 0;
    result.chunks = chunkArray(target.metrics, opts.chunkSize).length;
    return result;
  }
  const chunks = chunkArray(target.metrics, opts.chunkSize);
  Object.assign(result, {
    untouched: 0,
    chunks: chunks.length,
    usage: { ...EMPTY_USAGE },
    written: { inline: [], evidence: [] },
    acceptedKeys: [],
    rejectedDetail: [],
    skippedDetail: [],
    untouchedKeys: [],
    roleRecommendations: [],
    checks: [],
    chunkErrors: [],
  });
  for (const [i, metrics] of chunks.entries()) {
    const sub = { ...target, metrics };
    const label = chunks.length > 1 ? `${target.themeKey}#${i + 1}` : target.themeKey;
    const prompt = buildPrompt(sub, { surveyedAt: opts.surveyedAt });
    fs.writeFileSync(path.join(opts.localDir, `${label}.prompt.md`), prompt);
    let parsed;
    try {
      parsed = await callClaude(prompt, opts, state);
    } catch (e) {
      if (e?.code === "capacity-exhausted") throw e;
      result.chunkErrors.push(`${label}: ${String(e?.message ?? e).slice(0, 200)}`);
      result.untouched += metrics.length;
      result.untouchedKeys.push(...metrics.map((m) => m.rankingKey));
      log(`  ✗ ${label}: ${String(e?.message ?? e).slice(0, 160)}`);
      continue;
    }
    for (const k of ["inputTokens", "outputTokens", "totalTokens", "thinkingTokens"]) result.usage[k] += parsed.usage[k] ?? 0;
    result.usage.costUsd += parsed.costUsd ?? 0;
    result.usage.numTurns += parsed.numTurns ?? 0;
    result.usage.modelId ??= parsed.modelId;
    fs.writeFileSync(path.join(opts.localDir, `${label}.output.json`), parsed.text);
    let output;
    try {
      output = JSON.parse(parsed.text);
    } catch {
      result.chunkErrors.push(`${label}: モデル出力が JSON でない: ${parsed.text.slice(0, 120)}`);
      result.untouched += metrics.length;
      result.untouchedKeys.push(...metrics.map((m) => m.rankingKey));
      continue;
    }
    const applied = await applyOutput(sub, output, {
      surveyedAt: opts.surveyedAt,
      dryRun: false,
      requireCatalog: opts.requireCatalog,
      fetchSource: opts.fetchSource,
    });
    result.accepted += applied.accepted;
    result.rejected += applied.rejected;
    result.skipped += applied.skipped;
    result.untouched += applied.untouched;
    result.written.inline.push(...applied.written.inline);
    result.written.evidence.push(...applied.written.evidence);
    result.acceptedKeys.push(...applied.acceptedKeys);
    result.rejectedDetail.push(...applied.rejectedDetail);
    result.skippedDetail.push(...applied.skippedDetail);
    result.untouchedKeys.push(...applied.untouchedKeys);
    result.roleRecommendations.push(...applied.roleRecommendations);
    result.checks.push(...applied.checks);
    if (chunks.length > 1) {
      log(`  · ${label}: 通過 ${applied.accepted}/${metrics.length} 不合格 ${applied.rejected} skip ${applied.skipped} / $${(parsed.costUsd ?? 0).toFixed(2)} turns ${parsed.numTurns}`);
    }
  }
  if (result.chunkErrors.length) result.error = result.chunkErrors.join(" | ");
  result.status =
    result.accepted === result.targets ? "complete" : result.accepted > 0 ? "partial" : result.chunkErrors.length ? "error" : "none-accepted";
  return result;
}

async function cmdRun(args) {
  const opts = {
    model: args.model ?? "claude-sonnet",
    effort: args.effort ?? "medium",
    budgetUsd: Number(args["budget-usd"] ?? 5),
    chunkSize: Math.max(1, Number(args["chunk-size"] ?? 6)),
    concurrency: Math.min(2, Math.max(1, Number(args.concurrency ?? 2))),
    capacityWaitMin: Number(args["capacity-wait-min"] ?? 30),
    capacityRetries: Number(args["capacity-retries"] ?? 3),
    maxFailRate: Number(args["max-fail-rate"] ?? 0.3),
    minEntriesForRate: Number(args["min-entries-for-rate"] ?? 10),
    surveyedAt: args["surveyed-at"] ?? todayIso(),
    dryRun: Boolean(args["dry-run"]),
    requireCatalog: Boolean(args["require-catalog"]),
    localDir: LOCAL_DIR,
    fetchSource: createFetcher(),
  };
  if (!CLAUDE_CLI_MODELS[opts.model]) throw new Error(`--model は ${Object.keys(CLAUDE_CLI_MODELS).join("|")}`);
  if (!["low", "medium", "high"].includes(opts.effort)) throw new Error("--effort は low|medium|high");
  fs.mkdirSync(opts.localDir, { recursive: true });

  let targets = listTargets();
  if (args.themes) {
    const wanted = String(args.themes).split(",").map((s) => s.trim()).filter(Boolean);
    const known = new Set(targets.map((t) => t.themeKey));
    const missing = wanted.filter((k) => !known.has(k));
    if (missing.length) throw new Error(`対象が無いテーマ: ${missing.join(", ")}`);
    targets = wanted.map((k) => targets.find((t) => t.themeKey === k));
  }
  if (args.limit) targets = targets.slice(0, Number(args.limit));
  const classIndex = loadClassIndex();
  if (!classIndex) log("WARN: e-Stat カタログ未 pull。コードのカタログ照合は skip される (pull: node --import tsx .claude/scripts/estat/catalog.mjs pull)");
  for (const t of targets) attachClassNames(t, classIndex);

  const runId = args["run-id"] ?? `${opts.surveyedAt}-${new Date().toISOString().slice(11, 16).replace(":", "")}`;
  const run = {
    runId,
    startedAt: new Date().toISOString(),
    finishedAt: null,
    model: CLAUDE_CLI_MODELS[opts.model],
    effort: opts.effort,
    concurrency: opts.concurrency,
    surveyedAt: opts.surveyedAt,
    dryRun: opts.dryRun,
    stopReason: null,
    totals: { themes: targets.length, targets: 0, accepted: 0, rejected: 0, skipped: 0, untouched: 0, costUsd: 0, inputTokens: 0, outputTokens: 0 },
    themes: [],
  };
  run.totals.targets = targets.reduce((a, t) => a + t.metrics.length, 0);
  log(`run ${runId}: ${targets.length} テーマ / ${run.totals.targets} 指標 / model ${run.model} / concurrency ${opts.concurrency}${opts.dryRun ? " / dry-run" : ""}`);

  const state = { capacityStrikes: 0, evaluated: 0, failed: 0, stop: null };
  const queue = [...targets];
  const reportJson = path.join(opts.localDir, `run-${runId}.json`);
  const flush = () => fs.writeFileSync(reportJson, JSON.stringify(run, null, 2));

  const worker = async () => {
    while (queue.length > 0 && !state.stop) {
      const target = queue.shift();
      log(`▶ ${target.themeKey} (${target.metrics.length} 指標)`);
      let result;
      try {
        result = await processTheme(target, opts, state);
      } catch (e) {
        result = { ...emptyThemeResult(target), status: "error", error: String(e?.message ?? e).slice(0, 300) };
        if (e?.code === "capacity-exhausted") state.stop = `枠エラー ${opts.capacityRetries} 連続 (capacity-exhausted)`;
      }
      run.themes.push(result);
      run.totals.accepted += result.accepted;
      run.totals.rejected += result.rejected;
      run.totals.skipped += result.skipped;
      run.totals.untouched += result.untouched;
      if (result.usage) {
        run.totals.costUsd += result.usage.costUsd ?? 0;
        run.totals.inputTokens += result.usage.inputTokens ?? 0;
        run.totals.outputTokens += result.usage.outputTokens ?? 0;
      }
      // gate 不合格率 (skip = 資料なしは分母に入れない。gate に出した entry のうち落ちた割合)
      state.evaluated += result.accepted + result.rejected;
      state.failed += result.rejected;
      const rate = state.evaluated > 0 ? state.failed / state.evaluated : 0;
      log(
        `■ ${target.themeKey}: ${result.status} / 通過 ${result.accepted} 不合格 ${result.rejected} skip ${result.skipped} 未応答 ${result.untouched}` +
          (result.usage ? ` / $${(result.usage.costUsd ?? 0).toFixed(2)} turns ${result.usage.numTurns}` : "") +
          (result.error ? ` / ${result.error}` : ""),
      );
      if (!state.stop && state.evaluated >= opts.minEntriesForRate && rate > opts.maxFailRate) {
        state.stop = `gate 不合格率 ${(rate * 100).toFixed(0)}% > ${opts.maxFailRate * 100}% (${state.failed}/${state.evaluated})`;
      }
      flush();
    }
  };
  await Promise.all(Array.from({ length: opts.concurrency }, () => worker()));

  run.finishedAt = new Date().toISOString();
  run.stopReason = state.stop ?? (queue.length > 0 ? "中断" : null);
  flush();

  // dry-run は audits/ に report を残さない (配線確認だけ)。json は .local に残す
  const reportDir = opts.dryRun ? opts.localDir : (args.report ?? REPORT_DIR_DEFAULT);
  fs.mkdirSync(reportDir, { recursive: true });
  const reportMd = path.join(reportDir, `${opts.surveyedAt}-selection-backfill${opts.dryRun ? ".dry-run" : ""}.md`);
  // 同じ日に複数 run が走ったら追記 (夜 2 回・翌朝 1 回など)
  const md = buildMarkdownReport(run);
  fs.writeFileSync(reportMd, fs.existsSync(reportMd) ? `${fs.readFileSync(reportMd, "utf8").trimEnd()}\n\n---\n\n${md}` : md);
  log(`report: ${path.relative(PROJECT_ROOT, reportMd)} / json: ${path.relative(PROJECT_ROOT, reportJson)}`);
  log(
    `合計: 通過 ${run.totals.accepted} / 不合格 ${run.totals.rejected} / skip ${run.totals.skipped} / 未応答 ${run.totals.untouched} / $${run.totals.costUsd.toFixed(2)}` +
      (run.stopReason ? ` / 停止: ${run.stopReason}` : ""),
  );
  process.stdout.write(`${JSON.stringify({ runId, reportMd, reportJson, totals: run.totals, stopReason: run.stopReason }, null, 2)}\n`);
  if (state.stop) process.exitCode = 3;
}

// ---------------------------------------------------------------------------

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const sub = args._[0];
  if (sub === "targets") return cmdTargets(args);
  if (sub === "prompt") return cmdPrompt(args);
  if (sub === "apply") return cmdApply(args);
  if (sub === "reapply") return cmdReapply(args);
  if (sub === "run") return cmdRun(args);
  console.error("使い方: selection-backfill.mjs <targets|prompt|apply|run> [options] (冒頭コメント参照)");
  process.exit(1);
}

main().catch((e) => {
  console.error(`[selection-backfill] ERROR: ${e?.stack ?? e}`);
  process.exit(1);
});
