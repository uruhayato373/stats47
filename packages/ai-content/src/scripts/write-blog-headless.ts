import "dotenv/config";

/**
 * write-blog-headless.ts — ブログ記事の本文を headless `claude -p` (または Gemini API) で書き、
 * 決定的ゲートと別プロセスの critic まで通すバッチ。
 *
 * generate-blog-article.ts が用意した `contents/blog/<slug>/article.prompt.txt` を入力にする
 * (接地・データ健全性ゲート・SVG・prompt はそちらの決定的な準備段が持つ)。ここは:
 *
 *   1. author: prompt → article.md            (claude-sonnet effort low 既定 / gemini-api)
 *      research.md (NotebookLM の調査材料) があれば prompt に足す。数値は書かせない
 *   2. 決定的ゲート: quality-gate.mjs + ci-factual-gate.mjs。落ちたら blocker を添えて --retries 回まで書き直す
 *   3. critic: 記事本文だけを別プロセスで審査 → review.md (buildBlogCriticPrompt。執筆時の文脈は渡さない)
 *      REVISE なら blocker / major の指摘と原稿を author に返し、--revise-rounds 回まで 1〜3 をやり直す
 *   4. run report (.local/ci/blog-headless-<run>.json) と data/blog/headless-runs.csv に費用・通過を記録
 *
 * **公開しない。** published:false のまま残す。公開は人が `generate-blog-article.ts --ingest <slug>` で
 * 仕上げ、develop へ push する (月の上限 data/blog/seo-strategy.json と承認は人が持つ)。
 *
 * なぜ Agent tool (article-writer / blog-critic) を使わないか: subagent は CLAUDE.md + rules を毎ターン読み、
 * 是正で約 10 万トークン/本かかる。headless は repo 外 cwd・ツール無しで prompt だけを読む。
 * Claude を CI の cron で無人実行しない規約は不変 (人が本数と時期を決めて手元で回す)。
 *
 * CLI:
 *   npx tsx packages/ai-content/src/scripts/write-blog-headless.ts \
 *     [--slugs a,b] [--author claude-sonnet|claude-haiku|claude-opus|gemini-api] \
 *     [--critic claude-sonnet|claude-haiku|claude-opus|gemini-api|none] [--effort low] \
 *     [--retries 1] [--revise-rounds 1] [--limit 3] [--run-id ID] [--dry-run]
 *
 *   --slugs 省略時は article.prompt.txt があり article.md が無い slug を名前順に --limit 件
 *   --dry-run は LLM を呼ばず、対象と prompt 長だけ出す
 *
 * 正典: .claude/rules/blog-quality-standards.md / skill /write-blog-headless
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { isClaudeCliAlias, type ClaudeCliAlias } from "../services/claude-cli-output";
import { callClaudeCli } from "../services/claude-cli-runner";
import { GeminiTextError, generateContentText, resolveTextModel } from "../services/gemini-text-client";
import { buildBlogCriticPrompt, decideBlogCriticVerdict } from "../services/prompts/blog-article-prompt";
import { datasetDir } from "../../../../config/datasets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OUTBOX = path.join(PROJECT_ROOT, "contents/blog");
const HISTORY = path.join(PROJECT_ROOT, `${datasetDir("blog.operations")}/headless-runs.csv`);
const HISTORY_HEADER =
  "run_id,date,slug,author,critic,effort,author_calls,critic_calls,input_tokens,output_tokens,cost_usd,gate,verdict,seconds\n";

const AUTHOR_SYSTEM_PROMPT =
  "あなたは日本の都道府県統計サイトの記事執筆者です。ユーザーメッセージの指示だけに従い、article.md の中身だけを出力してください。前置き・補足説明・確認の質問は一切書かないでください。";
const CRITIC_SYSTEM_PROMPT =
  "あなたは統計記事の編集者です。ユーザーメッセージの指示だけに従い、指定された形式の審査結果だけを出力してください。";

type Engine = ClaudeCliAlias | "gemini-api";

/** モデルが ```markdown で包んだ場合に剥がす (generate-blog-article.ts は import すると main が走るので複製) */
function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return (m ? m[1] : t).trim();
}

const args = process.argv.slice(2);
const getArg = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};
const AUTHOR = (getArg("--author") ?? "claude-sonnet") as Engine;
const CRITIC = (getArg("--critic") ?? "claude-sonnet") as Engine | "none";
const EFFORT = getArg("--effort") ?? "low";
const RETRIES = Number(getArg("--retries") ?? "1");
const LIMIT = Number(getArg("--limit") ?? "3");
/** critic REVISE のあと指摘を返して書き直す回数 */
const REVISE_ROUNDS = Number(getArg("--revise-rounds") ?? "1");
const DRY_RUN = args.includes("--dry-run");
const RUN_ID = getArg("--run-id") ?? `blog-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}`;
/** thinking の上限。ランキング解説の実測で output (費用の主因) を直接減らした値 */
const MAX_THINKING = 1024;

function isEngine(value: string): value is Engine {
  return value === "gemini-api" || isClaudeCliAlias(value);
}

interface Usage {
  input: number;
  output: number;
  costUsd: number;
}

interface SlugResult {
  slug: string;
  status: "pass" | "revise" | "gate-rejected" | "fail" | "dry-run";
  authorCalls: number;
  criticCalls: number;
  usage: Usage;
  blockers: string[];
  verdict: string | null;
  seconds: number;
  error?: string;
}

async function callEngine(engine: Engine, prompt: string, systemPrompt: string): Promise<{ text: string; usage: Usage }> {
  if (engine === "gemini-api") {
    // 無料枠の鍵だけを使う前提 (課金を付けていない project)。費用は 0 として記録し、トークンは残す。
    const r = await generateContentText({
      prompt: `${systemPrompt}\n\n${prompt}`,
      apiKey: process.env.GEMINI_API_KEY ?? "",
      model: resolveTextModel(),
      maxAttempts: 3,
    });
    return { text: r.text, usage: { input: r.usage.inputTokens, output: r.usage.outputTokens, costUsd: 0 } };
  }
  const r = await callClaudeCli({ model: engine, prompt, systemPrompt, effort: EFFORT, maxThinking: MAX_THINKING });
  process.stdout.write(
    `  [${engine}] turns=${r.numTurns} in=${r.usage.inputTokens} out=${r.usage.outputTokens} cost=$${r.costUsd.toFixed(3)}\n`,
  );
  return { text: r.text, usage: { input: r.usage.inputTokens, output: r.usage.outputTokens, costUsd: r.costUsd } };
}

/** Gemini を使う run の最初に 1 回だけ極小の実生成で鍵を確かめる。402 / クレジット枯渇は billing で止める */
async function preflightGemini(): Promise<void> {
  if (!process.env.GEMINI_API_KEY?.trim()) {
    throw new Error("GEMINI_API_KEY が未設定です (課金を付けていない project の鍵を .env.local に置く)");
  }
  try {
    await generateContentText({
      prompt: "「ok」とだけ返してください。",
      apiKey: process.env.GEMINI_API_KEY,
      model: resolveTextModel(),
      maxAttempts: 1,
      maxOutputTokens: 16,
    });
  } catch (e) {
    if (e instanceof GeminiTextError && e.classification === "billing") {
      throw new Error(
        `Gemini preflight: billing (HTTP ${e.status})。鍵の project の前払いクレジットが枯渇している。` +
          "待機やモデル変更では復旧しない。課金を付けていない project で鍵を作り直す",
      );
    }
    throw new Error(`Gemini preflight 失敗: ${e instanceof Error ? e.message : String(e)}`);
  }
}

/**
 * NotebookLM などで集めた調査材料 (contents/blog/<slug>/research.md) があれば prompt に足す。
 * 白書の数値は実データ照合 (ci-factual-gate) の外なので書かせず、背景・論点・出典名だけに使わせる。
 */
function withResearch(prompt: string, dir: string): string {
  const researchPath = path.join(dir, "research.md");
  if (!fs.existsSync(researchPath)) return prompt;
  const research = fs.readFileSync(researchPath, "utf8").trim();
  if (!research) return prompt;
  return [
    prompt,
    "",
    "# 調査材料 (白書などの要点。背景の説明にだけ使います)",
    "ここにある数値・年・割合は本文に書きません (実データの節にある値だけが書けます)。",
    "制度や背景に触れるときは、文中に資料名を書きます (例: 「厚生労働白書によると」)。",
    "",
    research,
  ].join("\n");
}

function buildAuthorPrompt(
  basePrompt: string,
  blockers: string[],
  revision: { article: string; findings: string[] } | null,
): string {
  const parts = [basePrompt];
  if (revision) {
    parts.push(
      "",
      "# 前回の原稿は編集者の審査で差し戻されました",
      "下の原稿を、指摘をすべて解消するように直した全文を出力してください。上の絶対ルールと実データの制約は変わりません。",
      "実データに無い数値 (人口・面積・相関係数など) を足して直すことはできません。根拠を示せない主張は弱めるか削ってください。",
      "",
      "## 指摘",
      ...revision.findings,
      "",
      "## 前回の原稿",
      revision.article,
    );
  }
  if (blockers.length > 0) {
    parts.unshift(
      `## 前回の出力は機械チェックに落ちました。次の指摘を必ず直してください\n${blockers.map((b) => `- ${b}`).join("\n")}\n`,
    );
  }
  return parts.join("\n");
}

function runGates(slug: string): string[] {
  const articlePath = path.join(OUTBOX, slug, "article.md");
  const blockers: string[] = [];
  const q = spawnSync("node", [".claude/scripts/blog/quality-gate.mjs", articlePath], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  try {
    const parsed = JSON.parse(q.stdout) as { pass?: boolean; blockers?: string[] };
    if (parsed.pass !== true) blockers.push(...(parsed.blockers ?? ["quality-gate: pass=false"]));
  } catch {
    blockers.push(`quality-gate が JSON を返さなかった: ${q.stderr.slice(0, 200)}`);
  }
  const f = spawnSync("node", [".claude/scripts/blog/ci-factual-gate.mjs", slug], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
  });
  if (f.status !== 0) {
    const lines = f.stderr
      .split("\n")
      .filter((l) => l.includes("blocker:"))
      .map((l) => `factual: ${l.replace(/^.*blocker:\s*/, "")}`);
    blockers.push(...(lines.length ? lines : [`factual-gate exit ${f.status}`]));
  }
  return blockers;
}

/** critic の出力を review.md として保存する。reviewer は実際に審査したモデル名に書き換える */
function normalizeReview(text: string, slug: string, reviewer: string): { review: string; verdict: string | null } {
  const body = stripFence(text)
    .replace(/^reviewer:.*$/m, `reviewer: headless-critic/${reviewer}`)
    .replace(/^---\n/, `---\nslug: ${slug}\n`);
  const verdict = decideBlogCriticVerdict(body);
  const fixed = verdict ? body.replace(/^verdict:.*$/m, `verdict: ${verdict}`) : body;
  return { review: fixed.endsWith("\n") ? fixed : `${fixed}\n`, verdict };
}

function addUsage(a: Usage, b: Usage): Usage {
  return { input: a.input + b.input, output: a.output + b.output, costUsd: a.costUsd + b.costUsd };
}

async function processSlug(slug: string): Promise<SlugResult> {
  const started = Date.now();
  const dir = path.join(OUTBOX, slug);
  const basePrompt = withResearch(fs.readFileSync(path.join(dir, "article.prompt.txt"), "utf8"), dir);
  const result: SlugResult = {
    slug,
    status: "fail",
    authorCalls: 0,
    criticCalls: 0,
    usage: { input: 0, output: 0, costUsd: 0 },
    blockers: [],
    verdict: null,
    seconds: 0,
  };
  if (DRY_RUN) {
    log(`[dry-run] ${slug}: prompt ${basePrompt.length.toLocaleString()} 字`);
    return { ...result, status: "dry-run" };
  }

  try {
    // critic の指摘は author 側へ返して直させる (critic は毎回新しいプロセスで本文だけを読むので独立は保たれる)。
    let revision: { article: string; findings: string[] } | null = null;
    for (let round = 0; round <= REVISE_ROUNDS; round++) {
      let blockers: string[] = [];
      for (let attempt = 0; attempt <= RETRIES; attempt++) {
        // ゲートを緩めずに書き直させる。prompt 本体は同じで、直す材料だけを足す
        const prompt = buildAuthorPrompt(basePrompt, blockers, revision);
        const authored = await callEngine(AUTHOR, prompt, AUTHOR_SYSTEM_PROMPT);
        result.authorCalls++;
        result.usage = addUsage(result.usage, authored.usage);
        fs.writeFileSync(path.join(dir, "article.md"), `${stripFence(authored.text)}\n`);
        blockers = runGates(slug);
        log(`  [gate] ${slug} round ${round + 1} attempt ${attempt + 1}: blocker ${blockers.length}`);
        if (blockers.length === 0) break;
      }
      result.blockers = blockers;
      if (blockers.length > 0) {
        result.status = "gate-rejected";
        return result;
      }
      if (CRITIC === "none") {
        result.status = "pass";
        return result;
      }
      const article = fs.readFileSync(path.join(dir, "article.md"), "utf8");
      const reviewed = await callEngine(CRITIC, buildBlogCriticPrompt(article), CRITIC_SYSTEM_PROMPT);
      result.criticCalls++;
      result.usage = addUsage(result.usage, reviewed.usage);
      const { review, verdict } = normalizeReview(reviewed.text, slug, CRITIC);
      fs.writeFileSync(path.join(dir, "review.md"), review);
      result.verdict = verdict;
      log(`  [critic] ${slug} round ${round + 1}: ${verdict ?? "verdict 不明"}`);
      if (verdict === "PASS") {
        result.status = "pass";
        return result;
      }
      revision = {
        article,
        findings: review.split("\n").filter((l) => /^- \[(blocker|major)\]/.test(l)),
      };
    }
    result.status = "revise";
    return result;
  } catch (e) {
    result.error = e instanceof Error ? e.message : String(e);
    return result;
  } finally {
    result.seconds = Math.round((Date.now() - started) / 1000);
  }
}

function log(msg: string) {
  process.stdout.write(`${msg}\n`);
}

function pickSlugs(): string[] {
  const explicit = getArg("--slugs");
  if (explicit) return explicit.split(",").map((s) => s.trim()).filter(Boolean);
  return fs
    .readdirSync(OUTBOX)
    .filter((s) => fs.existsSync(path.join(OUTBOX, s, "article.prompt.txt")))
    .filter((s) => !fs.existsSync(path.join(OUTBOX, s, "article.md")))
    .sort()
    .slice(0, LIMIT);
}

function appendHistory(results: SlugResult[]) {
  if (!fs.existsSync(HISTORY)) fs.writeFileSync(HISTORY, HISTORY_HEADER);
  const date = new Date().toISOString().slice(0, 10);
  const rows = results.map((r) =>
    [
      RUN_ID,
      date,
      r.slug,
      AUTHOR,
      CRITIC,
      AUTHOR === "gemini-api" ? "" : EFFORT,
      r.authorCalls,
      r.criticCalls,
      r.usage.input,
      r.usage.output,
      r.usage.costUsd.toFixed(4),
      r.blockers.length === 0 && r.status !== "fail" ? "pass" : r.status === "fail" ? "error" : "reject",
      r.verdict ?? "",
      r.seconds,
    ].join(","),
  );
  fs.appendFileSync(HISTORY, `${rows.join("\n")}\n`);
}

async function main() {
  if (!isEngine(AUTHOR)) throw new Error(`--author は claude-haiku|claude-sonnet|claude-opus|gemini-api: ${AUTHOR}`);
  if (CRITIC !== "none" && !isEngine(CRITIC)) throw new Error(`--critic が不正: ${CRITIC}`);
  if (!Number.isInteger(RETRIES) || RETRIES < 0 || RETRIES > 2) throw new Error("--retries は 0〜2");
  if (!Number.isInteger(REVISE_ROUNDS) || REVISE_ROUNDS < 0 || REVISE_ROUNDS > 2) {
    throw new Error("--revise-rounds は 0〜2");
  }

  const slugs = pickSlugs();
  if (slugs.length === 0) {
    log("対象なし (先に generate-blog-article.ts --limit N で prompt を用意する)");
    return;
  }
  log(`対象 ${slugs.length} 本: ${slugs.join(" ")} / author ${AUTHOR} / critic ${CRITIC} / effort ${EFFORT}`);
  if (!DRY_RUN && (AUTHOR === "gemini-api" || CRITIC === "gemini-api")) await preflightGemini();

  // 直列で回す。並列にすると一時スロットリングで author 分を捨てる (ランキング解説 batch1 の実測)
  const results: SlugResult[] = [];
  for (const slug of slugs) {
    log(`\n=== ${slug} ===`);
    results.push(await processSlug(slug));
  }
  if (DRY_RUN) return;

  const report = path.join(PROJECT_ROOT, ".local/ci", `${RUN_ID}.json`);
  fs.mkdirSync(path.dirname(report), { recursive: true });
  fs.writeFileSync(
    report,
    `${JSON.stringify({ runId: RUN_ID, author: AUTHOR, critic: CRITIC, effort: EFFORT, retries: RETRIES, results }, null, 2)}\n`,
  );
  appendHistory(results);

  const total = results.reduce((a, r) => addUsage(a, r.usage), { input: 0, output: 0, costUsd: 0 });
  const pass = results.filter((r) => r.status === "pass").length;
  log(`\n=== ${RUN_ID} ===`);
  for (const r of results) {
    log(
      `${r.slug}: ${r.status} (author ${r.authorCalls} / critic ${r.criticCalls} / ` +
        `${r.usage.input + r.usage.output} tokens / $${r.usage.costUsd.toFixed(3)} / ${r.seconds}s)` +
        (r.error ? ` error=${r.error.slice(0, 160)}` : "") +
        (r.blockers.length ? ` blockers=${r.blockers.slice(0, 3).join(" | ")}` : ""),
    );
  }
  log(
    `PASS ${pass}/${results.length} / 合計 ${total.input + total.output} tokens / $${total.costUsd.toFixed(3)} ` +
      `(PASS 1 本あたり $${pass ? (total.costUsd / pass).toFixed(3) : "-"})`,
  );
  log(`report: ${path.relative(PROJECT_ROOT, report)} / history: ${path.relative(PROJECT_ROOT, HISTORY)}`);
  log("公開はしていない。PASS 分は人が generate-blog-article.ts --ingest <slug> で仕上げて develop へ push する");
  if (results.every((r) => r.status === "fail")) process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`::error::[write-blog-headless] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
