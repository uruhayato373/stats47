/**
 * headless `claude -p` を lean flag で 1 回呼ぶ runner (ブログ執筆バッチ用)。
 *
 * ランキング解説の generate-parallel.ts と同じ規律で spawn する:
 *   - cwd を repo 外に固定し、CLAUDE.md / .claude/rules / hooks / .mcp.json を読ませない
 *     (漏れると 1 call の input が ≈150K トークンになる)
 *   - ツール・MCP・session file を切る。--bare は OAuth を読まないので個別 flag で同等にする
 *   - 子に親セッションの CLAUDECODE / CLAUDE_* を継がせない (継ぐと Keychain を読まず「Not logged in」)
 *   - 一時スロットリングだけを待って再試行し、利用枠の枯渇や未ログインは即座に失敗させる
 *
 * 出力の読み取りは claude-cli-output.ts の純関数に任せる。
 */
import { spawn } from "node:child_process";
import { mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import {
  CLAUDE_CLI_MODELS,
  ClaudeCliError,
  createUtf8Collector,
  parseClaudeCliOutput,
  type ClaudeCliAlias,
  type ClaudeCliParsed,
} from "./claude-cli-output";

const CLI_CWD = path.join(tmpdir(), "stats47-blog-claude-cli");
const TRANSIENT_RE = /temporarily limiting|rate limited|overloaded|529|503/i;
const TRANSIENT_RETRIES = 5;
const TRANSIENT_BACKOFF_MS = 60_000;

export interface ClaudeCliCallOptions {
  model: ClaudeCliAlias;
  prompt: string;
  systemPrompt: string;
  /** --effort に渡す。null なら渡さない */
  effort: string | null;
  /** 子 env の MAX_THINKING_TOKENS。0 なら載せない */
  maxThinking: number;
}

function callOnce(options: ClaudeCliCallOptions): Promise<ClaudeCliParsed> {
  return new Promise((resolve, reject) => {
    mkdirSync(CLI_CWD, { recursive: true });
    const args = [
      "-p",
      "",
      "--output-format",
      "json",
      "--model",
      CLAUDE_CLI_MODELS[options.model],
      "--tools",
      "",
      "--strict-mcp-config",
      "--no-session-persistence",
      "--setting-sources",
      "local",
      "--system-prompt",
      options.systemPrompt,
    ];
    if (options.effort) args.push("--effort", options.effort);
    const env: NodeJS.ProcessEnv = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (key === "NODE_OPTIONS" || key === "CLAUDECODE" || key.startsWith("CLAUDE_")) continue;
      env[key] = value;
    }
    if (options.maxThinking > 0) env.MAX_THINKING_TOKENS = String(options.maxThinking);

    const proc = spawn(process.env.CLAUDE_CLI_BIN?.trim() || "claude", args, {
      stdio: ["pipe", "pipe", "pipe"],
      env,
      cwd: CLI_CWD,
    });
    const out = createUtf8Collector();
    const err = createUtf8Collector();
    proc.stdout.on("data", (d: Buffer) => out.push(d));
    proc.stderr.on("data", (d: Buffer) => err.push(d));
    proc.on("error", (e) => reject(new Error(`spawn error: ${e.message}`)));
    proc.on("close", (code) => {
      const stdout = out.end();
      const stderr = err.end();
      try {
        // 非 0 終了でも stdout が wrapper なら subtype 付きの ClaudeCliError として原因を残す
        const parsed = parseClaudeCliOutput(stdout);
        if (code !== 0) throw new Error(`claude CLI exit ${code}`);
        resolve(parsed);
      } catch (e) {
        if (e instanceof ClaudeCliError && e.subtype !== "invalid-output") reject(e);
        else reject(new Error(`claude CLI failed (code ${code}): ${(stderr || stdout).slice(0, 300)}`));
      }
    });
    proc.stdin.write(options.prompt, "utf-8");
    proc.stdin.end();
  });
}

export async function callClaudeCli(options: ClaudeCliCallOptions): Promise<ClaudeCliParsed> {
  for (let attempt = 0; ; attempt++) {
    try {
      return await callOnce(options);
    } catch (e) {
      const transient = e instanceof ClaudeCliError && TRANSIENT_RE.test(e.message);
      if (!transient || attempt >= TRANSIENT_RETRIES) throw e;
      const wait = TRANSIENT_BACKOFF_MS * (attempt + 1);
      process.stdout.write(`  [claude-cli] 一時スロットリング → ${wait / 1000}s 待って再試行\n`);
      await new Promise((r) => setTimeout(r, wait));
    }
  }
}
