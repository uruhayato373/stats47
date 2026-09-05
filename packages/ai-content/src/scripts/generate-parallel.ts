import "dotenv/config";

/**
 * generate-parallel.ts — ランキング AI コンテンツの DBレス バッチ生成 orchestrator。
 *
 * 旧版 (7569bd5c で削除) は D1 (`metrics` 読み + `upsertRankingAiContent` 書き) に依存していた。
 * 本版は **完全DBレス**:
 *   入力  : R2 観測値 + ranking item.json (build-input.ts)
 *   生成  : Gemini API 直接呼び出し (日次 CI) / headless claude CLI (ローカル量産) / gemini CLI
 *
 * ★定期運用 (無人 CI) は --model gemini-api --critic gemini-api で、生成と意味レビューを
 *   別リクエストに分離する。
 * ★ローカル量産 (人が量と時期を決めるセッション運転) は --model claude-sonnet --critic claude-sonnet。
 *   headless `claude -p` を repo 外 cwd・tools 無し・独自 system prompt で spawn するため、
 *   prompt ≈7K + 出力 ≈7K トークンで 1 件が終わる (Agent tool 経路は CLAUDE.md+rules ≈150K を
 *   毎ターン読み 1 件 $16-18 だった。量産に Agent tool を使わない理由)。
 *   Claude を CI cron で無人実行しない規約は不変 (ranking-content-standards.md)。
 *   ゲート: 生成物を audit-ai-content.mjs に通し blocker 0 のものだけ採用 (★旧版に無かった品質ゲート)
 *   出力  : staging dir に AiContentSnapshotRow を書き出す (R2 直書きしない)
 *           → r2-publisher / diff-push-r2 が staging を app/ranking/<key>/ai-content.json へ push
 *
 * ★Claude Code セッション内では claude CLI への大きい stdin がサンドボックスでブロックされるため、
 *   実生成は **ユーザー端末 (Claude Code 外)** で実行する (入口: .claude/scripts/ai-content/run-claude-batch.sh)。
 *   セッション内検証は --dry-run を使う。spawn する binary は PATH の `claude` (env CLAUDE_CLI_BIN で上書き可)。
 *
 * CLI:
 *   NODE_OPTIONS='--conditions react-server' R2_PUBLIC_FETCH_URL=https://storage.stats47.jp \
 *     tsx packages/ai-content/src/scripts/generate-parallel.ts \
 *       [--model gemini-api|claude-haiku|claude-sonnet|claude-opus|gemini] \
 *       [--critic none|gemini-api|claude-haiku|claude-sonnet|claude-opus] [--concurrency N] \
 *       [--cli-json-schema] [--cli-max-thinking N] [--cli-effort low|medium|high|xhigh|max] \
 *       [--limit N] [--area prefecture] [--force] [--out <dir>] [--dry-run] [--keys k1,k2] \
 *       [--retries N] [--outbox] [--report <file>]
 *
 *   --dry-run : callAI を呼ばず、各 key の prompt 長と「書き込む予定の staging パス」だけ出す (LLM 課金なし)
 *   --keys    : 対象 key をカンマ区切りで明示 (pending 走査をスキップ)
 *   --retries : ゲート落ち / JSON 崩れ時に同じ prompt でやり直す回数 (既定 1)。安価モデルの
 *               失敗率を実行時間で吸収する。**ゲートを緩めて通すことはしない**
 *   --cli-json-schema : claude CLI に --json-schema (構造化出力) を渡す。**既定は渡さない** — 実測 (2026-09-05)
 *               で構造化出力は CLI 内部が 2 ターンになり input が 4.3K → 32K に増えた。構造は audit ゲートが
 *               検証するので、本文の json fence を parse する経路で足りる
 *   --cli-max-thinking N : claude CLI 子プロセスの MAX_THINKING_TOKENS (既定 1024)。実測で Sonnet の output が
 *               19.7K → 13.1K、費用 $0.54 → $0.33。0 で無効化を試みる
 *   --cli-effort L : claude CLI に --effort L を渡す (既定 low・none で渡さない)。実測 (同一 prompt・Sonnet 5):
 *               既定 $0.54 / 148 秒 / output 19.7K → low $0.23 / 69 秒 / output 7.5K。生成物は監査・critic を通す
 *   --outbox  : staging ではなく git 公開 outbox (data/ai-content-staging/<key>.json) へ書く。
 *               R2 creds を持たない環境 (クラウドセッション / Routine) はこちらを使い、
 *               develop へ push すると publish-ai-content.yml が gate → R2 → CDN purge まで実行する
 *   --out     : staging dir (default .local/r2 = push ツールの固定ルート)。配下に app/ranking/<key>/ai-content.json
 *               → push は `push-r2-wrangler.ts app/ranking --apply` または `diff-push-r2.ts --prefix app/ranking`
 *                 (両者とも .local/r2 を読む。ai-content だけを surgical に push したいなら .local/r2/app/ranking に
 *                  ai-content.json のみを置いた状態で実行する)
 *
 * 関連: build-input.ts / list-pending.ts / .claude/scripts/ai-content/audit-ai-content.mjs
 *       .claude/agents/ranking-content-author.md
 */

import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { readActiveRankingKeysFromR2 } from "@stats47/ranking/server";
import { fetchFromR2AsJson } from "@stats47/r2-storage/server";
import { isOk } from "@stats47/types";
import type { AreaType } from "@stats47/types";
import { aiContentKeyPath, type AiContentSnapshotRow } from "../types/snapshot";
import { buildRankingContentPromptForKey } from "./build-input";
import { decideOutcome } from "../services/generation-outcome";
import {
  GEMINI_CRITIC_RESPONSE_SCHEMA,
  buildAiContentResponseSchema,
} from "../services/gemini-content-schemas";
import {
  buildGeminiCriticPrompt,
  parseGeminiCriticVerdict,
  reviewAiContentWithGemini,
} from "../services/gemini-content-critic";
import {
  CLAUDE_CLI_MODELS,
  ClaudeCliError,
  createUtf8Collector,
  isClaudeCliAlias,
  parseClaudeCliOutput,
  type ClaudeCliAlias,
} from "../services/claude-cli-output";
import {
  GeminiTextError,
  generateContentText,
  resolveTextModel,
  type GeminiQuotaDetails,
  type GeminiTokenUsage,
} from "../services/gemini-text-client";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// packages/ai-content/src/scripts → リポジトリルートは 4 つ上
const PROJECT_ROOT = path.resolve(__dirname, "../../../..");
const AUDIT_SCRIPT = path.join(
  PROJECT_ROOT,
  ".claude/scripts/ai-content/audit-ai-content.mjs",
);

type CriticChoice = "none" | "gemini-api" | ClaudeCliAlias;
const MODEL_CHOICES: readonly string[] = ["gemini-api", "gemini", ...Object.keys(CLAUDE_CLI_MODELS)];
const CRITIC_CHOICES: readonly string[] = ["none", "gemini-api", ...Object.keys(CLAUDE_CLI_MODELS)];

interface Options {
  model: string;
  critic: CriticChoice;
  concurrency: number;
  limit: number;
  areaType: AreaType;
  force: boolean;
  outDir: string;
  dryRun: boolean;
  keys: string[] | null;
  /** ゲート落ち / JSON 崩れ時に同じ prompt でやり直す回数 (0 = 再試行しない) */
  retries: number;
  /** true なら git 公開 outbox (data/ai-content-staging/<key>.json) へ書く (R2 creds 不要の公開経路) */
  outbox: boolean;
  /** CI 用の機械可読 run report (本文は含めない) */
  reportPath: string | null;
  /** claude CLI に --json-schema を渡すか (既定 false = 本文の json fence を parse する。true は 2 ターン化して高い) */
  cliJsonSchema: boolean;
  /** claude CLI 子プロセスの MAX_THINKING_TOKENS (0 = 設定しない) */
  cliMaxThinking: number;
  /** claude CLI の --effort (null = 渡さない) */
  cliEffort: string | null;
}

function parseArgs(): Options {
  const a = process.argv.slice(2);
  const get = (flag: string) => {
    const i = a.indexOf(flag);
    return i >= 0 ? a[i + 1] : undefined;
  };
  const model = get("--model") ?? "gemini-api";
  if (!MODEL_CHOICES.includes(model)) {
    throw new Error(`--model は ${MODEL_CHOICES.join(" | ")} のいずれかです: ${model}`);
  }
  const critic = get("--critic") ?? "gemini-api";
  if (!CRITIC_CHOICES.includes(critic)) {
    throw new Error(`--critic は ${CRITIC_CHOICES.join(" | ")} のいずれかです: ${critic}`);
  }
  const options: Options = {
    model,
    critic: critic as CriticChoice,
    concurrency: Number(get("--concurrency") ?? 1),
    limit: Number(get("--limit") ?? Infinity),
    areaType: (get("--area") ?? "prefecture") as AreaType,
    force: a.includes("--force"),
    // push ツール (push-r2-wrangler / diff-push-r2) は .local/r2 を固定ルートに読むため既定をそこに合わせる
    outDir: get("--out") ?? path.join(PROJECT_ROOT, ".local/r2"),
    dryRun: a.includes("--dry-run"),
    keys: get("--keys")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null,
    retries: Number(get("--retries") ?? 1),
    outbox: a.includes("--outbox"),
    reportPath: get("--report") ?? null,
    cliJsonSchema: a.includes("--cli-json-schema"),
    cliMaxThinking: Number(get("--cli-max-thinking") ?? 1024),
    cliEffort: (() => {
      const v = get("--cli-effort") ?? "low";
      return v === "none" ? null : v;
    })(),
  };
  if (!Number.isInteger(options.cliMaxThinking) || options.cliMaxThinking < 0) {
    throw new Error("--cli-max-thinking は 0 以上の整数です");
  }
  if (options.cliEffort && !["low", "medium", "high", "xhigh", "max"].includes(options.cliEffort)) {
    throw new Error(`--cli-effort は low | medium | high | xhigh | max のいずれかです: ${options.cliEffort}`);
  }
  if (!Number.isInteger(options.concurrency) || options.concurrency < 1) {
    throw new Error("--concurrency は 1 以上の整数です");
  }
  if (!(options.limit === Infinity || (Number.isInteger(options.limit) && options.limit >= 0))) {
    throw new Error("--limit は 0 以上の整数です");
  }
  if (!Number.isInteger(options.retries) || options.retries < 0 || options.retries > 3) {
    throw new Error("--retries は 0〜3 の整数です");
  }
  if ((options.model === "gemini-api" || options.critic === "gemini-api") && !options.dryRun) {
    if (!process.env.GEMINI_API_KEY?.trim()) {
      throw new Error("GEMINI_API_KEY が未設定です");
    }
  }
  return options;
}

// ============================================================
// AI 呼び出し (Gemini API が定期運用。CLI は手動フォールバック)
// ============================================================

/** Gemini の usage に API 換算費用を足したもの。cacheRead の割引を自前で掛けず、CLI の total_cost_usd を使う */
interface RunUsage extends GeminiTokenUsage {
  costUsd: number;
}

interface ModelCallResult {
  text: string;
  attempts: number;
  usage: RunUsage;
}

const ZERO_USAGE: RunUsage = {
  inputTokens: 0,
  outputTokens: 0,
  totalTokens: 0,
  thinkingTokens: 0,
  costUsd: 0,
};

/** claude CLI に渡す system prompt。既定の Claude Code system prompt (ツール説明・環境情報) を置き換えて prompt を軽くする */
const CLAUDE_CLI_SYSTEM_PROMPT =
  "あなたは統計データ解説の生成器です。ユーザーメッセージの指示だけに従い、要求された JSON を出力してください。前置き・補足説明・確認の質問は一切書かないでください。";

/**
 * claude CLI の cwd。**repo 外に固定**して CLAUDE.md / .claude/rules / .claude/settings.json の
 * project hooks / .mcp.json を自動読込させない (これが漏れると 1 call の入力が ≈150K トークンになる)。
 * run ごとに mkdtemp しないのは、~/.claude/projects/ に cwd ハッシュごとの空 dir が増え続けるため。
 */
const CLAUDE_CLI_CWD = path.join(tmpdir(), "stats47-ai-content-claude-cli");

/** run 中に CLI が実際に使った model ID (report の resolvedModel に載せる)。alias ではなく実 ID を記録する */
let observedClaudeModelId: string | null = null;
/** --cli-json-schema で true。parseArgs 後に main が設定する */
let cliJsonSchemaEnabled = false;
/** --cli-max-thinking。子 env の MAX_THINKING_TOKENS に載せる (0 なら載せない) */
let cliMaxThinking = 1024;
/** --cli-effort。claude CLI の --effort に渡す (既定 low) */
let cliEffort: string | null = "low";

function callCli(
  model: string,
  promptContent: string,
  jsonSchema: Record<string, unknown> | null = null,
  label = "cli",
  useJsonSchema: boolean = cliJsonSchemaEnabled,
): Promise<ModelCallResult> {
  return new Promise((resolve, reject) => {
    let cmd: string;
    let args: string[];
    let cwd: string | undefined;
    if (isClaudeCliAlias(model)) {
      cmd = process.env.CLAUDE_CLI_BIN?.trim() || "claude";
      mkdirSync(CLAUDE_CLI_CWD, { recursive: true });
      cwd = CLAUDE_CLI_CWD;
      args = [
        "-p",
        "",
        "--output-format",
        "json",
        "--model",
        CLAUDE_CLI_MODELS[model],
        // lean 化: ツール・MCP・session file・user/project settings (hooks) を全部切る。
        // --bare は OAuth を読まない (API key 必須) ので使わず、個別 flag で同等にする。
        "--tools",
        "",
        "--strict-mcp-config",
        "--no-session-persistence",
        "--setting-sources",
        "local",
        "--system-prompt",
        CLAUDE_CLI_SYSTEM_PROMPT,
      ];
      if (jsonSchema && useJsonSchema) {
        args.push("--json-schema", JSON.stringify(jsonSchema));
      }
      if (cliEffort) args.push("--effort", cliEffort);
    } else if (model === "gemini") {
      cmd = "gemini";
      args = ["-p", "", "-o", "text"];
    } else {
      reject(new Error(`unsupported CLI model: ${model}`));
      return;
    }
    // 子に親 Claude Code セッションの文脈 (CLAUDECODE / CLAUDE_CODE_* / CLAUDE_*) を継がせない。
    // 継ぐと CLI は host 管理の認証を待って Keychain を読まず「Not logged in」になる (2026-09-05 実測)。
    // ANTHROPIC_* は残す (利用者が意図して置く proxy / provider 設定を壊さない)。
    const childEnv: NodeJS.ProcessEnv = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key === "NODE_OPTIONS" || key === "CLAUDECODE" || key.startsWith("CLAUDE_")) continue;
      childEnv[key] = value;
    }
    // thinking の上限。生成タスクは書式順守が主で長考の効果が薄く、output トークン (費用の主因) を直接減らす。
    if (cwd && cliMaxThinking > 0) childEnv.MAX_THINKING_TOKENS = String(cliMaxThinking);
    const proc = spawn(cmd, args, {
      stdio: ["pipe", "pipe", "pipe"],
      env: childEnv,
      ...(cwd ? { cwd } : {}),
    });
    // ★chunk ごとに toString しない (境界で割れたマルチバイト文字が U+FFFD になる。2026-09-05 に文字化けで critic BLOCK)
    const outCollector = createUtf8Collector();
    const errCollector = createUtf8Collector();
    proc.stdout.on("data", (d: Buffer) => outCollector.push(d));
    proc.stderr.on("data", (d: Buffer) => errCollector.push(d));
    proc.on("close", (code) => {
      const stdout = outCollector.end();
      const stderr = errCollector.end();
      if (code !== 0) {
        // ★claude CLI はレート制限・未ログイン等を exit 1 + stdout の wrapper (is_error / result) で返し、
        //   stderr は空のことが多い (batch1 で 26 件が「CLI failed (code 1):」だけになり原因不明だった)。
        //   stdout を wrapper として読めれば ClaudeCliError (subtype 付き) にして原因を残す。
        if (isClaudeCliAlias(model) && stdout.trim()) {
          try {
            parseClaudeCliOutput(stdout);
          } catch (e) {
            if (e instanceof ClaudeCliError && e.subtype !== "invalid-output") {
              reject(e);
              return;
            }
          }
        }
        reject(
          new Error(
            `${model} CLI failed (code ${code}): ${stderr.slice(0, 300) || stdout.slice(0, 300)}`,
          ),
        );
        return;
      }
      if (!isClaudeCliAlias(model)) {
        resolve({ text: stdout, attempts: 1, usage: { ...ZERO_USAGE } });
        return;
      }
      try {
        const parsed = parseClaudeCliOutput(stdout);
        if (parsed.modelId && !observedClaudeModelId) observedClaudeModelId = parsed.modelId;
        // パイロットの実測用: どのモデルが何ターン回り、prompt が何トークンだったか (本文は出さない)
        const b = parsed.breakdown;
        process.stdout.write(
          `  [cli:${label}] ${parsed.modelIds.join("+") || "?"} turns=${parsed.numTurns} ` +
            `in=${b.input} cache_w=${b.cacheWrite} cache_r=${b.cacheRead} out=${b.output} cost=$${parsed.costUsd.toFixed(3)}\n`,
        );
        resolve({
          text: parsed.text,
          attempts: 1,
          usage: { ...parsed.usage, costUsd: parsed.costUsd },
        });
      } catch (e) {
        reject(e);
      }
    });
    proc.on("error", (e) => reject(new Error(`spawn error: ${e.message}`)));
    proc.stdin.write(promptContent, "utf-8");
    proc.stdin.end();
  });
}

async function callAI(options: {
  model: string;
  prompt: string;
  responseJsonSchema: Record<string, unknown>;
}): Promise<ModelCallResult> {
  if (options.model !== "gemini-api") {
    return callCli(options.model, options.prompt, options.responseJsonSchema, "author");
  }
  const generated = await generateContentText({
    prompt: options.prompt,
    apiKey: process.env.GEMINI_API_KEY ?? "",
    model: resolveTextModel(),
    responseJsonSchema: options.responseJsonSchema,
    // 無料枠の日次上限を内部retryで消費しない。再生成は外側の有界loopだけ。
    maxAttempts: 1,
  });
  return { ...generated, usage: { ...generated.usage, costUsd: 0 } };
}

function stripCodeFence(text: string): string {
  const match = text.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  return match ? match[1].trim() : text.trim();
}

// ============================================================
// audit ゲート: 候補 row を一時ファイルに書いて audit-ai-content.mjs --file に通す
// blocker 0 → true / 1 件でもあれば false
// ============================================================

function runAuditGate(row: AiContentSnapshotRow): Promise<{ ok: boolean; detail: string }> {
  return new Promise((resolve) => {
    const dir = mkdtempSync(path.join(tmpdir(), "ai-content-audit-"));
    const file = path.join(dir, `${row.rankingKey}.json`);
    writeFileSync(file, JSON.stringify(row), "utf-8");
    const { NODE_OPTIONS: _n, ...childEnv } = process.env;
    const proc = spawn("node", [AUDIT_SCRIPT, "--file", file, "--json"], {
      stdio: ["ignore", "pipe", "pipe"],
      env: childEnv,
    });
    const outCollector = createUtf8Collector();
    proc.stdout.on("data", (d: Buffer) => outCollector.push(d));
    proc.on("close", (code) => {
      const out = outCollector.end();
      rmSync(dir, { recursive: true, force: true });
      // exit 0 = blocker なし / exit 1 = blocker あり / exit 2 = audit 自体のエラー
      let detail = "";
      try {
        const j = JSON.parse(out);
        detail = (j.blockers ?? []).map((b: { code: string }) => b.code).join(",");
      } catch {
        detail = out.slice(0, 120);
      }
      resolve({ ok: code === 0, detail });
    });
    proc.on("error", (e) => {
      rmSync(dir, { recursive: true, force: true });
      resolve({ ok: false, detail: `audit spawn error: ${e.message}` });
    });
  });
}

// ============================================================
// staging 書き出し: <outDir>/app/ranking/<key>/ai-content.json
// ============================================================

function writeStaging(outDir: string, row: AiContentSnapshotRow): string {
  const rel = aiContentKeyPath(row.rankingKey); // app/ranking/<key>/ai-content.json
  const dest = path.join(outDir, rel);
  mkdirSync(path.dirname(dest), { recursive: true });
  writeFileSync(dest, JSON.stringify(row, null, 2) + "\n", "utf-8");
  return dest;
}

/**
 * git 公開 outbox (`data/ai-content-staging/<rankingKey>.json`) へ書き出す。
 *
 * R2 creds を持たない実行環境 (クラウドセッション / Routine) から公開へ届けるための経路。
 * develop に push すると publish-ai-content.yml が gate → R2 push → CDN purge → outbox 削除
 * まで自動実行する。**パスは階層化せずフラット**にすること (workflow の検出 glob が
 * `data/ai-content-staging/*.json` なので、`app/ranking/<key>/` 配下に置くと拾われない)。
 */
function writeOutbox(row: AiContentSnapshotRow): string {
  const dir = path.join(PROJECT_ROOT, "data/ai-content-staging");
  mkdirSync(dir, { recursive: true });
  const dest = path.join(dir, `${row.rankingKey}.json`);
  writeFileSync(dest, JSON.stringify(row, null, 2) + "\n", "utf-8");
  return dest;
}

// ============================================================
// 1 件処理
// ============================================================

interface Counters {
  ok: number;
  fail: number;
  skip: number;
  rejected: number;
}

type ResultStatus = "ok" | "fail" | "skip" | "rejected";

interface KeyResult {
  rankingKey: string;
  status: ResultStatus;
  reason: string;
  authorRequests: number;
  criticRequests: number;
  usage: RunUsage;
  quota?: GeminiQuotaDetails;
}

function addUsage(target: RunUsage, usage: GeminiTokenUsage & { costUsd?: number }): void {
  target.inputTokens += usage.inputTokens;
  target.outputTokens += usage.outputTokens;
  target.totalTokens += usage.totalTokens;
  target.thinkingTokens += usage.thinkingTokens;
  target.costUsd += usage.costUsd ?? 0;
}

function pushResult(
  results: KeyResult[],
  rankingKey: string,
  status: ResultStatus,
  reason: string,
  authorRequests: number,
  criticRequests: number,
  usage: RunUsage,
  quota?: GeminiQuotaDetails,
): void {
  results.push({
    rankingKey,
    status,
    reason,
    authorRequests,
    criticRequests,
    usage: { ...usage },
    ...(quota ? { quota } : {}),
  });
}

function criticRevisionPrompt(
  originalPrompt: string,
  issues: Array<{ section: string; severity: string; message: string }>,
): string {
  const feedback = issues
    .filter((issue) => issue.severity !== "MINOR")
    .slice(0, 8)
    .map((issue) => `- [${issue.section}/${issue.severity}] ${issue.message}`)
    .join("\n");
  return `${originalPrompt}\n\n## 前回候補の独立レビュー指摘\n\n次の問題をすべて解消し、JSON 全体を再生成してください。\n${feedback}`;
}

/**
 * REJECT / FAIL した候補と critic 指摘を .local/ci/rejected に残す (git 管理外・outbox ではないので公開されない)。
 * 何を書いて何を指摘されたかが残らないと prompt 側を直せない。
 */
function dumpDiagnostic(
  rankingKey: string,
  opts: Options,
  diag: { attempts: number; failure: unknown; issues: unknown[]; row: AiContentSnapshotRow | null },
): void {
  const dir = path.join(PROJECT_ROOT, ".local/ci/rejected");
  mkdirSync(dir, { recursive: true });
  const file = path.join(dir, `${rankingKey}-${Date.now()}.json`);
  writeFileSync(
    file,
    `${JSON.stringify(
      {
        rankingKey,
        model: opts.model,
        critic: opts.critic,
        attempts: diag.attempts,
        failure: diag.failure,
        criticIssues: diag.issues,
        candidate: diag.row,
      },
      null,
      2,
    )}\n`,
    "utf-8",
  );
  process.stdout.write(`        → 候補と critic 指摘を保存 (公開しない): ${file}\n`);
}

async function processOne(
  rankingKey: string,
  opts: Options,
  counters: Counters,
  results: KeyResult[],
): Promise<void> {
  const usage = { ...ZERO_USAGE };
  let authorRequests = 0;
  let criticRequests = 0;
  // 診断用 (REJECT / FAIL のどちらでも残す)
  let lastRow: AiContentSnapshotRow | null = null;
  let lastIssues: Array<{ section: string; severity: string; message: string }> = [];
  try {
    const built = await buildRankingContentPromptForKey(rankingKey, opts.areaType);
    if (!built) {
      process.stdout.write(`[SKIP] ${rankingKey}: 入力なし (item/観測値が R2 に無い)\n`);
      counters.skip++;
      pushResult(results, rankingKey, "skip", "missing-input", 0, 0, usage);
      return;
    }
    const { meta, prompt } = built;

    if (opts.dryRun) {
      const dest = opts.outbox
        ? path.join(PROJECT_ROOT, "data/ai-content-staging", `${rankingKey}.json`)
        : path.join(opts.outDir, aiContentKeyPath(rankingKey));
      process.stdout.write(
        `[DRY] ${rankingKey} (${meta.yearCode}): prompt ${prompt.length}字 → ${dest}\n`,
      );
      counters.ok++;
      pushResult(results, rankingKey, "ok", "dry-run", 0, 0, usage);
      return;
    }

    // ★生成 → 品質ゲート、失敗したら同じ prompt でやり直す。
    //   安いモデル (haiku / gemini) は JSON 崩れ・ルール違反を一定率で出すため、品質を
    //   下げる代わりに実行回数で払う。ゲートを緩めて通すことは絶対にしない。
    const maxAttempts = Math.max(1, opts.retries + 1);
    let lastFailure: { kind: "parse" | "gate" | "critic"; detail: string } | null = null;
    let authorPrompt = prompt;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      const generated = await callAI({
        model: opts.model,
        prompt: authorPrompt,
        responseJsonSchema: buildAiContentResponseSchema(meta.totalCount),
      });
      authorRequests += generated.attempts;
      addUsage(usage, generated.usage);
      const stripped = stripCodeFence(generated.text.trim());
      let parsed: {
        faq?: unknown;
        regionalAnalysis?: string;
        insights?: string;
        prefectureCommentary?: unknown;
      };
      try {
        parsed = JSON.parse(stripped);
      } catch {
        lastFailure = { kind: "parse", detail: "JSON parse error" };
        if (attempt < maxAttempts) {
          process.stdout.write(`[RETRY ${attempt}/${maxAttempts}] ${rankingKey}: JSON parse error\n`);
        }
        continue;
      }

      const now = new Date().toISOString();
      const row: AiContentSnapshotRow = {
        rankingKey,
        yearCode: meta.yearCode,
        faq: parsed.faq ? JSON.stringify(parsed.faq) : null,
        regionalAnalysis: parsed.regionalAnalysis ?? null,
        insights: parsed.insights ?? null,
        prefectureCommentary: parsed.prefectureCommentary
          ? JSON.stringify(parsed.prefectureCommentary)
          : null,
        createdAt: now,
        updatedAt: now,
      };
      lastRow = row;

      const gate = await runAuditGate(row);
      if (!gate.ok) {
        lastFailure = { kind: "gate", detail: gate.detail ?? "audit blocker" };
        if (attempt < maxAttempts) {
          process.stdout.write(
            `[RETRY ${attempt}/${maxAttempts}] ${rankingKey}: audit blocker (${gate.detail})\n`,
          );
        }
        continue;
      }

      // 意味レビュー (author と別リクエスト)。transport が違うだけで prompt / 判定 / REVISE 再生成は共通。
      let reviewed: {
        verdict: "PASS" | "REVISE";
        issues: Array<{ section: string; severity: string; message: string }>;
        attempts: number;
        usage: GeminiTokenUsage & { costUsd?: number };
      } | null = null;
      if (opts.critic === "gemini-api") {
        reviewed = await reviewAiContentWithGemini({
          rankingKey,
          candidate: parsed,
          apiKey: process.env.GEMINI_API_KEY ?? "",
          model: resolveTextModel(),
          maxAttempts: 1,
        });
      } else if (isClaudeCliAlias(opts.critic)) {
        // critic は常に --json-schema。schema なしだと section 欠落や平文「判定: REVISE」が返り parse 失敗で
        // author の費用が無駄になる (2026-09-05 実測)。出力 ~600 トークンなので 2 ターン化の追加は ≈$0.02。
        const called = await callCli(
          opts.critic,
          buildGeminiCriticPrompt(rankingKey, parsed),
          GEMINI_CRITIC_RESPONSE_SCHEMA,
          "critic",
          true,
        );
        const verdict = parseGeminiCriticVerdict(stripCodeFence(called.text.trim()));
        reviewed = { ...verdict, attempts: called.attempts, usage: called.usage };
      }
      if (reviewed) {
        criticRequests += reviewed.attempts;
        addUsage(usage, reviewed.usage);
        if (reviewed.verdict === "REVISE") {
          const detail = reviewed.issues
            .filter((issue) => issue.severity !== "MINOR")
            .slice(0, 3)
            .map((issue) => `${issue.section}:${issue.severity}`)
            .join(" / ");
          lastFailure = { kind: "critic", detail: detail || "semantic review" };
          lastIssues = reviewed.issues;
          if (attempt < maxAttempts) {
            authorPrompt = criticRevisionPrompt(prompt, reviewed.issues);
            process.stdout.write(
              `[RETRY ${attempt}/${maxAttempts}] ${rankingKey}: critic REVISE (${detail})\n`,
            );
          }
          continue;
        }
      }

      const dest = opts.outbox ? writeOutbox(row) : writeStaging(opts.outDir, row);
      const note = attempt > 1 ? ` (attempt ${attempt})` : "";
      process.stdout.write(`[OK] ${rankingKey} (${meta.yearCode})${note} → ${dest}\n`);
      counters.ok++;
      pushResult(results, rankingKey, "ok", "passed-all-gates", authorRequests, criticRequests, usage);
      return;
    }

    if (lastFailure?.kind === "parse") {
      process.stdout.write(`[FAIL] ${rankingKey}: JSON parse error (${maxAttempts} 回)\n`);
      counters.fail++;
      pushResult(results, rankingKey, "fail", "json-parse", authorRequests, criticRequests, usage);
    } else {
      process.stdout.write(
        `[REJECT] ${rankingKey}: ${lastFailure?.kind ?? "gate"} (${maxAttempts} 回) ${lastFailure?.detail ?? ""}\n`,
      );
      dumpDiagnostic(rankingKey, opts, {
        attempts: maxAttempts,
        failure: lastFailure,
        issues: lastIssues,
        row: lastRow,
      });
      counters.rejected++;
      pushResult(
        results,
        rankingKey,
        "rejected",
        `${lastFailure?.kind ?? "gate"}:${lastFailure?.detail ?? "unknown"}`.slice(0, 500),
        authorRequests,
        criticRequests,
        usage,
      );
    }
  } catch (err) {
    const geminiError = err instanceof GeminiTextError ? err : null;
    const cliError = err instanceof ClaudeCliError ? err : null;
    process.stdout.write(
      `[FAIL] ${rankingKey}: ${err instanceof Error ? err.message.slice(0, 200) : String(err)}\n`,
    );
    if (lastRow) {
      dumpDiagnostic(rankingKey, opts, {
        attempts: 0,
        failure: { kind: "error", detail: err instanceof Error ? err.message.slice(0, 300) : String(err) },
        issues: lastIssues,
        row: lastRow,
      });
    }
    counters.fail++;
    pushResult(
      results,
      rankingKey,
      "fail",
      geminiError
        ? `gemini-${geminiError.classification}`
        : cliError
          ? `claude-${cliError.subtype}`
          : "generation-error",
      authorRequests,
      criticRequests,
      usage,
      geminiError?.quota,
    );
  }
}

// ============================================================
// pending 抽出 (DBレス: R2 active keys → ai-content.json 未完のもの)
// ============================================================

async function collectPendingKeys(opts: Options): Promise<string[]> {
  if (opts.keys) return opts.keys;
  const keysResult = await readActiveRankingKeysFromR2(opts.areaType);
  if (!isOk(keysResult)) {
    throw new Error(`active keys 取得失敗: ${keysResult.error.message}`);
  }
  const allKeys = keysResult.data.map((k) => k.rankingKey);
  if (opts.force) return allKeys;

  const pending: string[] = [];
  const CONCURRENCY = 16;
  for (let i = 0; i < allKeys.length; i += CONCURRENCY) {
    const batch = allKeys.slice(i, i + CONCURRENCY);
    const results = await Promise.all(
      batch.map(async (k) => {
        const row = await fetchFromR2AsJson<AiContentSnapshotRow>(
          aiContentKeyPath(k),
        ).catch(() => null);
        const complete =
          row &&
          row.faq &&
          row.regionalAnalysis &&
          row.insights &&
          row.prefectureCommentary;
        return complete ? null : k;
      }),
    );
    pending.push(...results.filter((k): k is string => k !== null));
  }
  return pending;
}

function writeRunReport(options: {
  path: string;
  opts: Options;
  startedAt: string;
  targets: number;
  counters: Counters;
  results: KeyResult[];
}): void {
  const usage = { ...ZERO_USAGE };
  let authorRequests = 0;
  let criticRequests = 0;
  for (const result of options.results) {
    addUsage(usage, result.usage);
    authorRequests += result.authorRequests;
    criticRequests += result.criticRequests;
  }
  const report = {
    version: 1,
    startedAt: options.startedAt,
    completedAt: new Date().toISOString(),
    model: options.opts.model,
    resolvedModel:
      options.opts.model === "gemini-api"
        ? resolveTextModel()
        : isClaudeCliAlias(options.opts.model)
          ? (observedClaudeModelId ?? CLAUDE_CLI_MODELS[options.opts.model])
          : options.opts.model,
    resolvedCritic:
      options.opts.critic === "gemini-api"
        ? resolveTextModel()
        : isClaudeCliAlias(options.opts.critic)
          ? CLAUDE_CLI_MODELS[options.opts.critic]
          : options.opts.critic,
    critic: options.opts.critic,
    dryRun: options.opts.dryRun,
    targets: options.targets,
    counters: options.counters,
    requests: {
      author: authorRequests,
      critic: criticRequests,
      total: authorRequests + criticRequests,
    },
    usage,
    results: options.results,
  };
  mkdirSync(path.dirname(options.path), { recursive: true });
  writeFileSync(options.path, `${JSON.stringify(report, null, 2)}\n`, "utf-8");
}

// ============================================================
// main
// ============================================================

async function main() {
  const startedAt = new Date().toISOString();
  const opts = parseArgs();
  cliJsonSchemaEnabled = opts.cliJsonSchema;
  cliMaxThinking = opts.cliMaxThinking;
  cliEffort = opts.cliEffort;
  const pending = await collectPendingKeys(opts);
  const targets = Number.isFinite(opts.limit)
    ? pending.slice(0, opts.limit)
    : pending;

  process.stdout.write(
    `=== AI Content Generator (model: ${opts.model}, critic: ${opts.critic}, concurrency: ${opts.concurrency}${opts.dryRun ? ", DRY-RUN" : ""}) ===\n`,
  );
  process.stdout.write(
    `pending ${pending.length} 件中 ${targets.length} 件を処理 → ${
      opts.outbox
        ? `outbox: ${path.join(PROJECT_ROOT, "data/ai-content-staging")} (develop へ push すると公開)`
        : `staging: ${opts.outDir}`
    }\n`,
  );

  const counters: Counters = { ok: 0, fail: 0, skip: 0, rejected: 0 };
  const results: KeyResult[] = [];
  for (let i = 0; i < targets.length; i += opts.concurrency) {
    const batch = targets.slice(i, i + opts.concurrency);
    await Promise.all(batch.map((k) => processOne(k, opts, counters, results)));
  }

  const totalUsage = results.reduce<RunUsage>((acc, r) => {
    addUsage(acc, r.usage);
    return acc;
  }, { ...ZERO_USAGE });
  process.stdout.write(
    `\n=== 完了: OK ${counters.ok} / REJECT ${counters.rejected} / FAIL ${counters.fail} / SKIP ${counters.skip} ===\n` +
      `tokens: input ${totalUsage.inputTokens} / output ${totalUsage.outputTokens} / cost(API換算) $${totalUsage.costUsd.toFixed(4)}` +
      (results.length > 0
        ? ` / 1件あたり input ${Math.round(totalUsage.inputTokens / results.length)}`
        : "") +
      "\n",
  );
  if (opts.reportPath) {
    writeRunReport({
      path: path.resolve(opts.reportPath),
      opts,
      startedAt,
      targets: targets.length,
      counters,
      results,
    });
  }
  if (!opts.dryRun && counters.ok > 0) {
    if (opts.outbox) {
      process.stdout.write("次: outbox を develop へ push すると publish-ai-content.yml が R2 公開します\n");
    } else {
      process.stdout.write(
        `次: ${opts.outDir}/app/ranking/<key>/ai-content.json を R2 へ push\n` +
          `   npx tsx packages/r2-storage/src/scripts/push-r2-wrangler.ts app/ranking --apply\n` +
          `   (または diff-push-r2.ts --prefix app/ranking。両者とも .local/r2 を読む)\n`,
      );
    }
  }

  // ★1 件も出せなかったら run を失敗させる (silent green の再発防止・2026-07-30)。
  //   部分的な失敗は成功扱い (残りは次回のキューが拾う)。判定は generation-outcome.ts。
  const outcome = decideOutcome(counters, targets.length, { dryRun: opts.dryRun });
  if (outcome.exitCode !== 0) {
    process.stderr.write(`::error::[generate-parallel] ${outcome.reason}\n`);
    process.exitCode = outcome.exitCode;
    return;
  }
  process.stdout.write(`${outcome.reason}\n`);
}

main().catch((err) => {
  process.stderr.write(
    `[generate-parallel] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
