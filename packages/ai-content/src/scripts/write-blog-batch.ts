import "dotenv/config";

/**
 * write-blog-batch.ts — ブログ記事を 1 コマンドで量産する。
 *
 *   1. 需要順に対象を選ぶ (topic-queue の pending × 直近 4 週の GSC 表示回数)
 *   2. generate-blog-article.ts で接地・健全性と書く価値の判定・図・prompt を用意する
 *   3. research.md を取り込む (--research-dir / --notebook)
 *   4. write-blog-headless.ts で書いて審査する (最大 3 並列・--retries 2 --revise-rounds 2)
 *   5. 合格分を --ingest で公開待ちへ確定する
 *   6. 結果の一覧と、背景が未生成の記事の一覧を出す
 *
 * **公開も R2 への書き込みもしない。** push は人が行う。Claude を CI の cron で回さない規約も同じ。
 * 背景は Codex の工程なので、ここでは作らない。topic-queue の status も書かない。送り箱に slug が
 * ある間は選ばれず、公開すると公開済みとして外れる。
 *
 * CLI:
 *   npm run blog:batch -- --source <調査> --count <本数> \
 *     [--topics a,b] [--concurrency 3] [--retries 2] [--revise-rounds 2] \
 *     [--research-dir <dir>] [--notebook <NotebookLM のノート名>] [--run-id ID] [--dry-run]
 *
 *   --source  トピックの出どころ (kakei-rollout)、metric の surveyId / source.kind (kakei-chousa)、
 *             調査名 (家計調査) のどれか。省略すると全トピックから選ぶ
 *   --topics  topicKey を直接指定する (--source と --count を使わない)
 *   --research-dir  <dir>/<slug>.md か <dir>/<topicKey>.md を research.md として取り込む
 *   --notebook      指定のノートへ背景を聞いて research.md に保存する (Claude のトークンを使わない)
 *   --dry-run       選んだ対象を出すだけで、何も書かない
 *
 * 正典: .claude/rules/blog-quality-standards.md「量産バッチ」 / skill /write-prepared-article
 */
import { spawn, spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  addRankingImpressions,
  classifyIngest,
  rankBatchTopics,
  renderBatchSummary,
  type BatchRow,
  type MetricSourceInfo,
  type RankedTopic,
  type TopicEntry,
} from "../services/blog-batch";
// @stats47/types を依存に持たないため、サイト識別子の正本 JSON を直接読む
import SITE from "../../../types/src/site.json";
import { datasetDir } from "../../../../config/datasets.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OUTBOX = path.join(PROJECT_ROOT, "contents/blog");
const OPERATIONS_DIR = path.join(PROJECT_ROOT, datasetDir("blog.operations"));
const QUEUE = path.join(OPERATIONS_DIR, "topic-queue.json");
const GSC_SNAPSHOTS = path.join(PROJECT_ROOT, datasetDir("gsc.snapshots"));
const METRICS_DIR = path.join(PROJECT_ROOT, datasetDir("metrics.definitions"));
const R2 = process.env.R2_PUBLIC_FETCH_URL || SITE.r2PublicBaseUrl;
const SCRIPTS = "packages/ai-content/src/scripts";
/** 需要を足す週の数 */
const DEMAND_WEEKS = 4;
/** 書く価値の判定で止まる指標があるので、本数のこの倍まで準備を試す */
const PREPARE_ATTEMPT_FACTOR = 3;

const args = process.argv.slice(2);
const getArg = (flag: string) => {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
};
const SOURCE = getArg("--source");
const COUNT = Number(getArg("--count") ?? "3");
const TOPICS = getArg("--topics")?.split(",").map((s) => s.trim()).filter(Boolean) ?? null;
const CONCURRENCY = getArg("--concurrency") ?? "3";
const RETRIES = getArg("--retries") ?? "2";
const REVISE_ROUNDS = getArg("--revise-rounds") ?? "2";
const RESEARCH_DIR = getArg("--research-dir");
const NOTEBOOK = getArg("--notebook");
const DRY_RUN = args.includes("--dry-run");
const RUN_ID = getArg("--run-id") ?? `blog-batch-${new Date().toISOString().slice(0, 19).replace(/[-:T]/g, "")}`;

function log(msg: string) {
  process.stdout.write(`${msg}\n`);
}

function runTsx(script: string, scriptArgs: string[], env: NodeJS.ProcessEnv = process.env) {
  return spawnSync("npx", ["tsx", `${SCRIPTS}/${script}`, ...scriptArgs], {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    env,
    maxBuffer: 64 * 1024 * 1024,
  });
}

/** 書き手のログをそのまま流し、終わるまで待つ */
function runTsxStreaming(script: string, scriptArgs: string[]): Promise<number | null> {
  return new Promise((resolve, reject) => {
    const child = spawn("npx", ["tsx", `${SCRIPTS}/${script}`, ...scriptArgs], {
      cwd: PROJECT_ROOT,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", resolve);
  });
}

function loadDemand(): Map<string, number> {
  const demand = new Map<string, number>();
  const weeks = fs.readdirSync(GSC_SNAPSHOTS).filter((w) => /^\d{4}-W\d{2}$/.test(w)).sort().slice(-DEMAND_WEEKS);
  for (const week of weeks) {
    const csv = path.join(GSC_SNAPSHOTS, week, "pages.csv");
    if (fs.existsSync(csv)) addRankingImpressions(fs.readFileSync(csv, "utf8"), demand);
  }
  return demand;
}

function loadMetricSources(): Map<string, MetricSourceInfo> {
  const metrics = new Map<string, MetricSourceInfo>();
  for (const file of fs.readdirSync(METRICS_DIR)) {
    if (!file.endsWith(".ts")) continue;
    const text = fs.readFileSync(path.join(METRICS_DIR, file), "utf8");
    const key = text.match(/"key":\s*"([^"]+)"/)?.[1];
    if (!key) continue;
    metrics.set(key, {
      surveyId: text.match(/"surveyId":\s*"([^"]+)"/)?.[1],
      sourceKind: text.match(/"source":\s*\{\s*"kind":\s*"([^"]+)"/)?.[1],
      displayName: text.match(/"displayName":\s*"([^"]+)"/)?.[1],
    });
  }
  return metrics;
}

async function fetchPublishedSlugs(): Promise<string[]> {
  const res = await fetch(`${R2}/app/blog/all.json`);
  if (!res.ok) throw new Error(`公開済み一覧を読めません (HTTP ${res.status})。重複を避けられないので止めます`);
  const all = (await res.json()) as { slug?: string }[] | { items?: { slug?: string }[]; articles?: { slug?: string }[] };
  const list = Array.isArray(all) ? all : (all.items ?? all.articles ?? []);
  return list.map((a) => a.slug).filter((s): s is string => Boolean(s));
}

async function selectTopics(): Promise<RankedTopic[]> {
  const { queue } = JSON.parse(fs.readFileSync(QUEUE, "utf8")) as { queue: TopicEntry[] };
  const topics = TOPICS ? queue.filter((t) => TOPICS.includes(t.topicKey)) : queue;
  if (TOPICS && topics.length !== TOPICS.length) {
    const known = new Set(topics.map((t) => t.topicKey));
    throw new Error(`topic-queue に無いトピック: ${TOPICS.filter((t) => !known.has(t)).join(", ")}`);
  }
  // 送り箱に dir があれば別の作業が持っているので触らない
  const taken = new Set([...fs.readdirSync(OUTBOX), ...(await fetchPublishedSlugs())]);
  return rankBatchTopics({
    topics,
    source: TOPICS ? null : SOURCE,
    metrics: loadMetricSources(),
    demand: loadDemand(),
    takenSlugs: taken,
  });
}

/** 準備して書ける状態にする。止まった理由は最初の [reject] 行 */
function prepare(candidate: RankedTopic): { ready: boolean; note: string } {
  const r = runTsx("generate-blog-article.ts", ["--topic", candidate.topic.topicKey, "--limit", "1"]);
  const ready = fs.existsSync(path.join(OUTBOX, candidate.slug, "article.prompt.txt"));
  const reason = r.stdout.split("\n").find((l) => l.startsWith("[reject]"));
  const crashed = r.stderr.split("\n").find((l) => l.startsWith("Error:"));
  return { ready, note: reason?.replace("[reject] ", "") ?? (ready ? "" : (crashed ?? "準備できない型か接地の失敗")) };
}

function importResearch(candidate: RankedTopic): boolean {
  const target = path.join(OUTBOX, candidate.slug, "research.md");
  if (RESEARCH_DIR) {
    for (const name of [candidate.slug, candidate.topic.topicKey]) {
      const file = path.join(RESEARCH_DIR, `${name}.md`);
      if (fs.existsSync(file)) {
        fs.copyFileSync(file, target);
        return true;
      }
    }
  }
  if (NOTEBOOK) {
    const question =
      `「${candidate.topic.label}」について、都道府県差の背景・関連する制度・白書での扱いを、` +
      "資料名と章を添えて箇条書きで教えてください。数値は不要です。";
    const r = spawnSync("node", [".claude/scripts/notebooklm/notebooklm-cross-query.mjs", "--notebooks", NOTEBOOK, question], {
      cwd: PROJECT_ROOT,
      encoding: "utf8",
    });
    // ログイン切れでも書ける (調査材料なしの記事になる) ので止めず、一覧の欄で分かるようにする
    if (r.status === 0 && r.stdout.trim()) {
      fs.writeFileSync(target, r.stdout);
      return true;
    }
    log(`[research] ${candidate.slug}: 取得できず (exit ${r.status}) ${r.stderr.trim().slice(0, 120)}`);
  }
  return false;
}

function ingest(slug: string) {
  const r = runTsx("generate-blog-article.ts", ["--ingest", slug], {
    ...process.env,
    NODE_OPTIONS: "--conditions react-server",
  });
  return { outcome: classifyIngest(r.stdout, r.status), output: r.stdout };
}

function readTitle(slug: string): string | undefined {
  const article = path.join(OUTBOX, slug, "article.md");
  if (!fs.existsSync(article)) return undefined;
  return fs.readFileSync(article, "utf8").match(/^title:\s*"?(.*?)"?\s*$/m)?.[1];
}

interface HeadlessResult {
  slug: string;
  status: string;
  authorCalls: number;
  usage: { input: number; output: number; costUsd: number };
  blockers: string[];
  error?: string;
}

function readHeadlessReport(): HeadlessResult[] {
  const report = path.join(PROJECT_ROOT, ".local/ci", `${RUN_ID}.json`);
  if (!fs.existsSync(report)) return [];
  return (JSON.parse(fs.readFileSync(report, "utf8")) as { results: HeadlessResult[] }).results;
}

async function main() {
  if (!TOPICS && (!Number.isInteger(COUNT) || COUNT < 1)) throw new Error("--count は 1 以上の整数");
  if (RESEARCH_DIR && !fs.existsSync(RESEARCH_DIR)) throw new Error(`--research-dir がありません: ${RESEARCH_DIR}`);

  const candidates = await selectTopics();
  const wanted = TOPICS ? candidates.length : COUNT;
  log(`候補 ${candidates.length} 件 / 目標 ${wanted} 本 / source ${SOURCE ?? "指定なし"}`);
  if (DRY_RUN) {
    for (const c of candidates.slice(0, wanted)) {
      log(`  ${c.slug} 型${c.topic.archetype} 需要 ${c.demand.toLocaleString("ja-JP")} (${c.topic.topicKey})`);
    }
    return;
  }
  if (candidates.length === 0) {
    log("書ける対象がありません (build-topic-queue.mjs で topic-queue を更新する)");
    return;
  }

  const rows = new Map<string, BatchRow>();
  const ready: RankedTopic[] = [];
  for (const candidate of candidates.slice(0, wanted * PREPARE_ATTEMPT_FACTOR)) {
    if (ready.length >= wanted) break;
    log(`[prepare] ${candidate.slug}`);
    const prepared = prepare(candidate);
    if (prepared.ready) {
      const research = importResearch(candidate);
      ready.push(candidate);
      rows.set(candidate.slug, { slug: candidate.slug, status: "fail", demand: candidate.demand, research });
    } else {
      log(`[skip] ${candidate.slug}: ${prepared.note}`);
      rows.set(candidate.slug, { slug: candidate.slug, status: "skipped", demand: candidate.demand, note: prepared.note });
    }
  }

  if (ready.length > 0) {
    await runTsxStreaming("write-blog-headless.ts", [
      "--slugs", ready.map((c) => c.slug).join(","),
      "--retries", RETRIES,
      "--revise-rounds", REVISE_ROUNDS,
      "--concurrency", CONCURRENCY,
      "--run-id", RUN_ID,
    ]);
  }

  for (const result of readHeadlessReport()) {
    const row = rows.get(result.slug);
    if (!row) continue;
    row.authorCalls = result.authorCalls;
    row.tokens = result.usage.input + result.usage.output;
    row.costUsd = result.usage.costUsd;
    row.title = readTitle(result.slug);
    if (result.status === "pass") {
      const { outcome, output } = ingest(result.slug);
      row.status = outcome === "rejected" ? "ingest-rejected" : outcome;
      if (outcome === "rejected") row.note = output.trim().split("\n").slice(-3).join(" ").slice(0, 160);
    } else {
      row.status = result.status === "revise" || result.status === "gate-rejected" ? result.status : "fail";
      row.note = (result.error ?? result.blockers.slice(0, 2).join(" / ")).slice(0, 160);
    }
  }

  const summary = renderBatchSummary(
    [...rows.values()],
    (slug) => `npm run blog-images:codex -- request-article --slug ${slug} --article contents/blog/${slug}/article.md`,
  );
  const summaryPath = path.join(PROJECT_ROOT, ".local/ci", `${RUN_ID}-summary.md`);
  fs.mkdirSync(path.dirname(summaryPath), { recursive: true });
  fs.writeFileSync(summaryPath, `${summary}\n`);
  log(`\n=== ${RUN_ID} ===\n${summary}`);
  log(`\n一覧: ${path.relative(PROJECT_ROOT, summaryPath)}`);
  log("公開はしていない。公開待ちと背景待ちは contents/blog に残る。push は人が行う");
  const passed = [...rows.values()].some((r) => r.status === "ready" || r.status === "background-pending");
  if (!passed) process.exitCode = 1;
}

main().catch((err) => {
  process.stderr.write(`::error::[write-blog-batch] ${err instanceof Error ? err.message : String(err)}\n`);
  process.exit(2);
});
