/**
 * SNS 投稿画像の週次確認 (Mac ローカル・launchd `scripts/scheduled/sns-image-review.sh`)。
 *
 * X / Threads の画像は投稿時にこの Mac から各 SNS へ上げており R2 に無い (`.local/r2/sns/...` だけにある) ので、
 * CI ではなくこの Mac で動かす。Instagram は R2 公開 URL から取る。
 * 決定的な検査 (画像の欠落・Instagram 画像の寸法・本文の長さ) をしたあと、Claude (読み取り専用) に
 * 画像と本文を見せて指摘を構造化出力で受け取り、見せていない投稿を指す指摘は捨てる。
 * 結果は `.local/sns-review/` に置き (git・R2 は触らない)、`--issue` で `sns-review-alert` Issue を更新する。
 *
 * Usage:
 *   npx tsx .claude/scripts/sns/review-sns-images.ts [--days 8] [--no-agent] [--issue]
 *
 * Exit code: 0 = 指摘なし / 3 = 指摘あり (通知する) / 2 = 実行エラー
 * 正典: .claude/rules/sns-content-standards.md §5.6
 */
import { execFileSync, spawnSync } from "node:child_process";
import { existsSync, mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { basename, join, resolve } from "node:path";

import sharp from "sharp";

import store from "../lib/sns-posts-store.cjs";
import {
  buildSnsReport,
  itemsFromIgSchedule,
  itemsFromPosts,
  type MechanicalFinding,
  mechanicalFindings,
  type ReviewItem,
  validateAgentReview,
} from "./lib/sns-image-review";

const { MAX_WEIGHTED_LENGTH, weightedLength } = require("../lib/x-weighted-length.cjs") as {
  MAX_WEIGHTED_LENGTH: number;
  weightedLength: (text: string) => number;
};

const PROJECT_ROOT = resolve(__dirname, "..", "..", "..");
const PUBLIC_BASE = process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp";
const OUT_DIR = join(PROJECT_ROOT, ".local/sns-review");
const PROMPT = join(PROJECT_ROOT, ".claude/prompts/local/sns-image-review.md");
const SCHEMA = JSON.stringify({
  type: "object",
  properties: {
    status: { type: "string", enum: ["reviewed", "no-issues", "blocked"] },
    summary: { type: "string", minLength: 10, maxLength: 800 },
    findings: {
      type: "array",
      maxItems: 15,
      items: {
        type: "object",
        properties: {
          itemId: { type: "string" },
          severity: { type: "string", enum: ["high", "medium", "low"] },
          issue: { type: "string", minLength: 10 },
          suggestion: { type: "string", minLength: 5 },
        },
        required: ["itemId", "severity", "issue", "suggestion"],
        additionalProperties: false,
      },
    },
  },
  required: ["status", "summary", "findings"],
  additionalProperties: false,
});

function arg(flag: string): string | undefined {
  const i = process.argv.indexOf(flag);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function fetchBuffer(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
    return res.ok ? Buffer.from(await res.arrayBuffer()) : null;
  } catch {
    return null;
  }
}

/** ローカルパス (`.local/r2/...`) ならそのまま、R2 キーなら公開 URL から作業フォルダへ落とす。 */
async function resolveImage(source: string, mediaDir: string): Promise<{ source: string; path?: string; width?: number; height?: number; ok: boolean }> {
  let path: string | undefined;
  if (source.startsWith(".local/")) {
    const local = join(PROJECT_ROOT, source);
    if (existsSync(local)) path = local;
    else {
      const buf = await fetchBuffer(`${PUBLIC_BASE}/${source.replace(/^\.local\/r2\//, "")}`);
      if (buf) {
        path = join(mediaDir, source.replace(/[/\\]/g, "__"));
        writeFileSync(path, buf);
      }
    }
  } else {
    const buf = await fetchBuffer(`${PUBLIC_BASE}/${source}`);
    if (buf) {
      path = join(mediaDir, source.replace(/[/\\]/g, "__"));
      writeFileSync(path, buf);
    }
  }
  if (!path) return { source, ok: false };
  const meta = await sharp(path).metadata();
  return { source, path, width: meta.width, height: meta.height, ok: true };
}

function loadIgSchedules(): Array<Parameters<typeof itemsFromIgSchedule>[0][number]> {
  const dir = join(PROJECT_ROOT, ".claude/state");
  return readdirSync(dir)
    .filter((f) => /^instagram-w\d+-schedule\.json$/.test(f))
    .flatMap((f) => {
      const raw = JSON.parse(readFileSync(join(dir, f), "utf-8"));
      return Array.isArray(raw) ? raw : raw.entries ?? [];
    });
}

/** Claude を読み取り専用で実行し、構造化出力を返す (launchd でも動くよう npx 経由)。 */
function runAgent(inputPath: string, maxTurns: number): unknown {
  const prompt = readFileSync(PROMPT, "utf-8").replace("{{INPUT}}", inputPath);
  const result = spawnSync(
    "npx",
    [
      "--yes",
      "@anthropic-ai/claude-code",
      "-p",
      prompt,
      "--model",
      "sonnet",
      "--output-format",
      "json",
      "--json-schema",
      SCHEMA,
      "--tools",
      "Read,Glob",
      "--allowedTools",
      "Read,Glob",
      "--disallowedTools",
      "Bash,Write,Edit,WebFetch,WebSearch",
      "--permission-mode",
      "dontAsk",
      "--max-turns",
      String(maxTurns),
      "--no-session-persistence",
      "--strict-mcp-config",
      "--mcp-config",
      '{"mcpServers":{}}',
      "--setting-sources",
      "project",
    ],
    { cwd: PROJECT_ROOT, encoding: "utf-8", maxBuffer: 50 * 1024 * 1024, timeout: 30 * 60 * 1000 }
  );
  if (result.status !== 0) throw new Error(`claude exited ${result.status}: ${(result.stderr ?? "").slice(-300)}`);
  const out = JSON.parse(result.stdout) as { subtype?: string; is_error?: boolean; structured_output?: unknown };
  if (out.subtype !== "success" || out.is_error || !out.structured_output) throw new Error(`claude result: ${out.subtype}`);
  return out.structured_output;
}

function updateIssue(body: string | null): void {
  const gh = (args: string[]) => execFileSync("gh", args, { cwd: PROJECT_ROOT, encoding: "utf-8" }).trim();
  try {
    gh(["label", "create", "sns-review-alert", "--description", "SNS 投稿画像の週次確認", "--color", "fbca04", "--force"]);
    gh(["label", "create", "auto-generated", "--description", "機械監査アラート", "--color", "ededed", "--force"]);
  } catch {
    /* ラベル作成の失敗は下の issue 操作で表面化する */
  }
  const existing = gh(["issue", "list", "--state", "open", "--label", "sns-review-alert", "--json", "number", "--jq", ".[0].number // empty"]);
  const title = "[SNS Review] 予約中の投稿画像に確認が必要です";
  if (body) {
    const file = join(OUT_DIR, "issue.md");
    writeFileSync(file, body);
    if (existing) gh(["issue", "edit", existing, "--title", title, "--body-file", file]);
    else gh(["issue", "create", "--title", title, "--label", "sns-review-alert,auto-generated", "--body-file", file]);
  } else if (existing) {
    gh(["issue", "close", existing, "--reason", "completed", "--comment", "予約中の投稿画像に指摘が無くなったため自動Closeします。"]);
  }
}

async function main() {
  const days = Number(arg("--days") ?? "8");
  const now = new Date();
  const to = new Date(now.getTime() + days * 86_400_000);
  const date = now.toISOString().slice(0, 10);
  const mediaDir = join(OUT_DIR, date, "media");
  mkdirSync(mediaDir, { recursive: true });

  const posts = (store as { loadAll: () => never[] }).loadAll();
  const items: ReviewItem[] = [...itemsFromPosts(posts, now, to), ...itemsFromIgSchedule(loadIgSchedules(), now, to)];

  const mechanical: MechanicalFinding[] = [];
  const reviewInput: Array<{ id: string; platform: string; scheduledAt: string; caption: string; images: string[] }> = [];
  for (const item of items) {
    if (item.platform === "instagram") {
      const caption = await fetchBuffer(`${PUBLIC_BASE}/sns/${item.domain}/${item.contentKey}/instagram/caption.txt`);
      item.caption = caption ? caption.toString("utf-8") : "";
    }
    const resolved = item.skipped ? [] : await Promise.all(item.imageSources.map((s) => resolveImage(s, mediaDir)));
    mechanical.push(...mechanicalFindings(item, resolved, weightedLength, MAX_WEIGHTED_LENGTH));
    const images = resolved.filter((r) => r.ok && r.path).map((r) => r.path as string);
    if (!item.skipped && images.length > 0) {
      reviewInput.push({ id: item.id, platform: item.platform, scheduledAt: item.scheduledAt, caption: item.caption, images });
    }
  }

  const inputPath = join(OUT_DIR, date, "input.json");
  writeFileSync(inputPath, `${JSON.stringify({ generatedAt: now.toISOString(), items: reviewInput }, null, 2)}\n`);

  let agent: ReturnType<typeof validateAgentReview> | null = null;
  let agentError: string | null = null;
  if (process.argv.includes("--no-agent")) agentError = "--no-agent で実行";
  else if (reviewInput.length === 0) agentError = null;
  else {
    const imageCount = reviewInput.reduce((sum, i) => sum + i.images.length, 0);
    try {
      agent = validateAgentReview(runAgent(inputPath, imageCount + 30), new Set(reviewInput.map((i) => i.id)));
    } catch (e) {
      agentError = (e as Error).message;
    }
  }

  const report = buildSnsReport({
    date,
    from: now.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
    items,
    mechanical,
    agent,
    agentError,
  });
  const latest = {
    generatedAt: now.toISOString(),
    window: { from: now.toISOString(), to: to.toISOString() },
    itemCount: items.length,
    reviewedCount: reviewInput.length,
    mechanical,
    agentStatus: agent?.status ?? "not-run",
    agentSummary: agent?.summary ?? null,
    agentFindings: agent?.findings ?? [],
    rejected: agent?.rejected ?? [],
    agentError,
  };
  writeFileSync(join(OUT_DIR, "latest.json"), `${JSON.stringify(latest, null, 2)}\n`);
  writeFileSync(join(OUT_DIR, "latest.md"), `${report ?? `## SNS 投稿画像の週次確認 (${date})\n\n指摘なし (${items.length} 件を確認)。`}\n`);
  console.log(
    `[sns-review] 対象 ${items.length} 件 (画像確認 ${reviewInput.length}) / 機械検出 ${mechanical.length} / agent 指摘 ${agent?.findings.length ?? 0} / 不採用 ${agent?.rejected.length ?? 0}${agentError ? ` / agent: ${agentError}` : ""}`
  );
  console.log(`[sns-review] 報告: ${join(OUT_DIR, "latest.md")} (${basename(inputPath)})`);

  if (process.argv.includes("--issue")) updateIssue(report);
  process.exit(report ? 3 : 0);
}

main().catch((e) => {
  console.error(`[sns-review] エラー: ${(e as Error).stack ?? e}`);
  process.exit(2);
});
