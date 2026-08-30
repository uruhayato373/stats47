import "dotenv/config";

/**
 * generate-blog-article.ts — ブログ新規記事の無人生成 orchestrator。
 *
 * `generate-parallel.ts` (ランキング ai-content) のブログ版。**このスクリプトは LLM を呼ばない**:
 *   入力  : topic-queue (何を書くか) + R2 観測値 (数値の出どころ)
 *   生成  : Claude Code Base Action / 対話セッション。ここは prompt を渡すだけ
 *   ゲート: quality-gate.mjs で blocker 0 のものだけ採用。**ゲートを緩めて通すことはしない**
 *   出力  : docs/21_ブログ記事原稿/<slug>/ (git outbox)。R2 直書きしない
 *           → develop へ push すると blog-auto-publish.yml が再検証して R2 公開まで実行する
 *
 * ## なぜ本スクリプト自身は LLM 呼び出しを持たないか
 *
 * prompt 準備と LLM orchestration を分けることで、接地・データゲートをモデルに委ねず、
 * CI と対話セッションの双方が同じ決定的な準備・ingest を再利用できる。日次 CI は
 * `CLAUDE_CODE_OAUTH_TOKEN` で公式 Base Action を起動し、執筆と critic だけをモデルに任せる。
 *
 * ## 工程
 *
 *   1. topic-queue から pending を取る            ← このスクリプト
 *   2. R2 観測値を接地 (fetch-ranking-data-r2.mjs) ← このスクリプト
 *   3. **データ健全性ゲート** (blog-topic-gate)    ← このスクリプト。壊れた metric の記事は書かない
 *   4. SVG 生成 (generate-article-charts.ts)       ← このスクリプト
 *   5. prompt を article.prompt.txt に書き出す     ← このスクリプト (ここで停止)
 *   ---- ここから Claude Code routine / 対話セッション ----
 *   6. prompt を読んで article.md を書く           ← article-writer
 *   7. `--ingest <slug>` でゲート                  ← このスクリプト。落ちたら 6 に戻る
 *   8. blog-critic (別コンテキストの subagent)     ← review.md を書く
 *   9. `--ingest <slug>` で PASS 確認 → published:true → 最終ゲート
 *
 * ## critic を分ける理由
 *
 * `blog-quality-standards.md` が禁じているのは「**書いた本人が自己採点して公開する**」こと。
 * critic は別コンテキストの subagent が担い、記事本文だけを読む (ground truth も型の指示も
 * 渡さない)。`--ingest` は review.md の verdict を読むだけで、自分では審査しない。
 *
 * CLI:
 *   npx tsx packages/ai-content/src/scripts/generate-blog-article.ts \
 *     [--limit N] [--topic <topicKey>] [--dry-run] [--ingest <slug>]
 *
 *   (既定)       : 接地〜prompt 書き出しまで。LLM は呼ばない
 *   --dry-run    : 接地とゲートだけ確認して接地物を残さない
 *   --ingest S   : セッションが書いた article.md をゲート → critic PASS なら公開待ちに確定
 *
 * 正典: .claude/rules/blog-quality-standards.md / .claude/rules/blog-data-schema.md §0
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { gateTopicData, type GroundedRow } from "../services/blog-topic-gate";
import { decideOutcome } from "../services/generation-outcome";
import {
  buildBlogArticlePrompt,
  type BlogArchetype,
  type GroundTruthMetric,
} from "../services/prompts/blog-article-prompt";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..", "..", "..", "..");
const OUTBOX = path.join(PROJECT_ROOT, "docs/21_ブログ記事原稿");
const QUEUE = path.join(PROJECT_ROOT, ".claude/state/blog/topic-queue.json");
const R2 = process.env.R2_PUBLIC_FETCH_URL || "https://storage.stats47.jp";

// ---------- CLI ----------
const args = process.argv.slice(2);
const getArg = (f: string) => {
  const i = args.indexOf(f);
  return i >= 0 ? args[i + 1] : null;
};
const LIMIT = Number(getArg("--limit") ?? "1");
const ONLY_TOPIC = getArg("--topic");
const DRY_RUN = args.includes("--dry-run");
const KEEP_DRAFT = args.includes("--keep-draft");
/** セッションが書いた article.md を取り込んで仕上げる */
const INGEST_SLUG = getArg("--ingest");

/**
 * 扱う型。
 *
 * 単一指標の型は「ランキング + タイルマップ」の 2 枚、型B (相関) は
 * 「指標A ランキング + 指標B ランキング + 散布図」の 3 枚で構成する。
 *
 * 型B に散布図が要るのは、2 指標の関係を論じる記事に主指標だけの図を貼っても問いに
 * 答えられないからです (2026-07-31 に dry-run で実際にその形になることを確認し、
 * 散布図の接地 fetch-correlation-scatter.mjs を通してから解禁しました)。
 */
const SUPPORTED_ARCHETYPES = new Set(["A", "B", "C", "D", "D2", "F", "G"]);

interface TopicEntry {
  topicKey: string;
  archetype: string;
  metricKeys: string[];
  label: string;
  suggestedTitle: string;
  status: string;
  lane: string;
  /** 47 県に満たない散布図で、対象外の県がなぜ対象外かを宣言する (§blog-svg-chart-standards §6-3) */
  exclusionReason?: string;
}

function log(msg: string) {
  process.stdout.write(`${msg}\n`);
}

/**
 * topicKey → slug。**決定的**にする (毎回同じ slug になる)。
 * 既存記事と同じ命名 (`<metric>-prefecture-gap`) に寄せ、URL が長くなりすぎないよう切る。
 */
export function slugForTopic(topic: Pick<TopicEntry, "topicKey" | "metricKeys" | "archetype">): string {
  const primary = topic.metricKeys[0] ?? topic.topicKey;
  // 型B は 2 指標の関係が主題なので slug も両方を含める。切り詰めで衝突しても
  // 「既に存在」でスキップされるだけなので安全側に倒れる。
  const base =
    topic.archetype === "B" && topic.metricKeys.length >= 2
      ? `${topic.metricKeys[0]}-vs-${topic.metricKeys[1]}`
      : `${primary}-prefecture-gap`;
  if (base.length <= 60) return base;
  const cut = base.slice(0, 60);
  const boundary = cut.lastIndexOf("-");
  return boundary > 20 ? cut.slice(0, boundary) : cut;
}

function run(cmd: string, cmdArgs: string[]): { ok: boolean; stdout: string; stderr: string } {
  const r = spawnSync(cmd, cmdArgs, {
    cwd: PROJECT_ROOT,
    encoding: "utf8",
    maxBuffer: 64 * 1024 * 1024,
  });
  return { ok: r.status === 0, stdout: r.stdout ?? "", stderr: r.stderr ?? "" };
}

/** quality-gate を回して blocker 一覧を返す */
function runQualityGate(articlePath: string): { pass: boolean; blockers: string[] } {
  const r = run("node", [".claude/scripts/blog/quality-gate.mjs", articlePath]);
  try {
    const parsed = JSON.parse(r.stdout) as { pass?: boolean; blockers?: string[] };
    return { pass: parsed.pass === true, blockers: parsed.blockers ?? [] };
  } catch {
    return {
      pass: false,
      blockers: [`quality-gate が JSON を返さなかった: ${r.stderr.slice(0, 200)}`],
    };
  }
}

/** 公開済み slug (R2) を取り、重複記事を書かないようにする */
async function fetchPublishedSlugs(): Promise<Set<string>> {
  try {
    const res = await fetch(`${R2}/app/blog/all.json`);
    if (!res.ok) return new Set();
    const all: unknown = await res.json();
    const list = Array.isArray(all)
      ? all
      : ((all as { items?: unknown[]; articles?: unknown[] }).items ??
        (all as { articles?: unknown[] }).articles ??
        []);
    return new Set(
      (list as { slug?: string }[]).map((a) => a.slug).filter((s): s is string => Boolean(s)),
    );
  } catch {
    return new Set();
  }
}

/** item.json から category を引いて内部リンク候補を作る (取れなければ areas だけ) */
async function buildAllowedLinks(
  rankingKey: string,
  rows: GroundedRow[],
): Promise<{ href: string; label: string }[]> {
  const links: { href: string; label: string }[] = [];
  try {
    const res = await fetch(`${R2}/app/ranking/${rankingKey}/item.json`);
    if (res.ok) {
      const json = (await res.json()) as {
        item?: { categoryKey?: string };
        categoryKey?: string;
      };
      const categoryKey = json.item?.categoryKey ?? json.categoryKey;
      if (categoryKey) {
        links.push({ href: `/category/${categoryKey}`, label: "同じカテゴリの統計一覧" });
      }
    }
  } catch {
    // category が取れなくても記事は書ける
  }
  for (const row of rows.slice(0, 2)) {
    const code = (row as { areaCode?: string }).areaCode;
    if (code) links.push({ href: `/areas/${code}`, label: `${row.areaName}のデータ` });
  }
  return links;
}

/** モデルが ```markdown で包んだ場合に剥がす */
export function stripFence(text: string): string {
  const t = text.trim();
  const m = t.match(/^```(?:markdown|md)?\n([\s\S]*?)\n```$/);
  return (m ? m[1] : t).trim();
}

function ensureTrailingNewline(s: string): string {
  return s.endsWith("\n") ? s : `${s}\n`;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

/**
 * セッションが書いた article.md を取り込む (`--ingest <slug>`)。
 *
 * ゲートに掛け、review.md が PASS なら published:true にして最終ゲートを通す。
 * **critic はここでは呼ばない** — 別コンテキストの subagent (blog-critic) が
 * review.md を書く責務を持つ。「書いた本人が自己採点して公開する」形を作らないため。
 *
 * 終了コード: 0=公開可 / 1=ゲート落ち or critic 未通過 (blocker を出す)
 */
function ingest(slug: string): number {
  const dir = path.join(OUTBOX, slug);
  const articlePath = path.join(dir, "article.md");
  if (!fs.existsSync(articlePath)) {
    log(`[fail] ${slug}: article.md がありません (先にセッションが書きます)`);
    return 1;
  }

  const gate = runQualityGate(articlePath);
  if (!gate.pass) {
    log(`[reject] ${slug}: ゲート blocker ${gate.blockers.length} 件`);
    for (const b of gate.blockers.slice(0, 10)) log(`    - ${b}`);
    return 1;
  }
  log(`[ok] ${slug}: ゲート PASS`);

  const reviewPath = path.join(dir, "review.md");
  if (!fs.existsSync(reviewPath)) {
    log(`[wait] ${slug}: review.md がありません (blog-critic の審査待ち)`);
    return 1;
  }
  const review = fs.readFileSync(reviewPath, "utf8");
  if (!/^verdict:\s*PASS\b/im.test(review)) {
    log(`[reject] ${slug}: critic が REVISE`);
    return 1;
  }
  log(`[ok] ${slug}: critic PASS`);

  const body = fs
    .readFileSync(articlePath, "utf8")
    .replace(/^published:\s*false\s*$/m, "published: true")
    .replace(/^publishedAt:\s*未定\s*$/m, `publishedAt: ${today()}`);
  fs.writeFileSync(articlePath, body);

  const finalGate = runQualityGate(articlePath);
  if (!finalGate.pass) {
    log(`[reject] ${slug}: 公開フラグ後のゲートで落ちた`);
    for (const b of finalGate.blockers.slice(0, 10)) log(`    - ${b}`);
    return 1;
  }
  log(`[ok] ${slug} — 公開待ち (develop へ push すると blog-auto-publish が公開します)`);
  return 0;
}

async function main() {
  // --ingest はキューを見ない (セッションが書き終えた 1 件を仕上げるだけ)
  if (INGEST_SLUG) {
    process.exit(ingest(INGEST_SLUG));
  }

  if (!fs.existsSync(QUEUE)) {
    process.stderr.write(`::error::topic-queue がありません: ${QUEUE}\n`);
    process.exit(1);
  }

  const queue = JSON.parse(fs.readFileSync(QUEUE, "utf8")) as { queue: TopicEntry[] };
  const published = await fetchPublishedSlugs();

  const candidates = queue.queue
    .filter((t) => t.status === "pending")
    .filter((t) => (ONLY_TOPIC ? t.topicKey === ONLY_TOPIC : true));

  const counters = { ok: 0, rejected: 0, fail: 0, skip: 0 };
  const targets: string[] = [];

  for (const topic of candidates) {
    if (counters.ok >= LIMIT) break;

    if (!SUPPORTED_ARCHETYPES.has(topic.archetype)) {
      // 型B は散布図が要る (SUPPORTED_ARCHETYPES の注釈参照)。件数を数えたいので skip に入れる。
      counters.skip++;
      continue;
    }

    const slug = slugForTopic(topic);
    const dir = path.join(OUTBOX, slug);
    if (published.has(slug) || fs.existsSync(path.join(dir, "article.md"))) {
      log(`[skip] ${slug} — 既に存在`);
      counters.skip++;
      continue;
    }
    targets.push(slug);
    log(`\n=== ${slug} (型${topic.archetype}) ===`);

    // --- 1. データ接地 ---
    // 型B は 2 指標のランキング + 散布図で構成するため地図は作らない (図が多すぎると
    // 図あたりの解説字数の床に届かなくなる)。単一指標の型はランキング + 地図。
    const isPair = topic.archetype === "B" && topic.metricKeys.length >= 2;
    const fetchArgs = [
      ".claude/scripts/blog/fetch-ranking-data-r2.mjs",
      "--slug",
      slug,
      "--keys",
      topic.metricKeys.join(","),
      ...(isPair ? [] : ["--with-map"]),
    ];
    const fetched = run("node", fetchArgs);
    if (!fetched.ok) {
      log(`[reject] データ接地に失敗: ${fetched.stderr.trim().slice(0, 200)}`);
      fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }

    // --- 2. データ健全性ゲート (壊れた metric の記事は書かない) ---
    const dataDir = path.join(dir, "data");
    const primaryJson = path.join(dataDir, `${slug}-prefecture-rankings.json`);
    if (!fs.existsSync(primaryJson)) {
      log(`[reject] 接地データが見つからない: ${path.relative(PROJECT_ROOT, primaryJson)}`);
      fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }
    const payload = JSON.parse(fs.readFileSync(primaryJson, "utf8")) as {
      title: string;
      unit: string;
      year: string;
      source: string;
      rankingKey: string;
      data: GroundedRow[];
    };
    const verdict = gateTopicData(payload.rankingKey, payload.data, new Date());
    if (!verdict.ok) {
      log(`[reject] データ健全性ゲート: ${verdict.reasons.join(" / ")}`);
      fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }

    // 型B: 散布図を R2 相関 snapshot から接地する。相関ペアが snapshot に無ければ
    // この記事は成立しないので skip する (主指標だけの図で相関記事を書かない)。
    let scatterBase: string | null = null;
    let secondMetric: GroundTruthMetric | null = null;
    if (isPair) {
      const [aKey, bKey] = topic.metricKeys;
      const secondJson = path.join(dataDir, `${bKey}-prefecture-rankings.json`);
      if (!fs.existsSync(secondJson)) {
        log(`[reject] 第2指標の接地に失敗: ${bKey}`);
        fs.rmSync(dir, { recursive: true, force: true });
        counters.rejected++;
        continue;
      }
      const second = JSON.parse(fs.readFileSync(secondJson, "utf8")) as typeof payload;
      const secondVerdict = gateTopicData(second.rankingKey, second.data, new Date());
      if (!secondVerdict.ok) {
        log(`[reject] 第2指標のデータ健全性ゲート: ${secondVerdict.reasons.join(" / ")}`);
        fs.rmSync(dir, { recursive: true, force: true });
        counters.rejected++;
        continue;
      }
      // 海に面していない県のように構造的に対象外の地域があるペアは 47 点に満たない。
      // その理由は指標の意味からしか決まらないので、トピック側の宣言だけを通す
      // (無いまま流すと接地スクリプトが fail-closed で止まる)。
      const scatter = run("node", [
        ".claude/scripts/blog/fetch-correlation-scatter.mjs",
        "--slug", slug, "--base", aKey, "--pair", bKey,
        ...(topic.exclusionReason ? ["--exclusion-reason", topic.exclusionReason] : []),
      ]);
      if (!scatter.ok) {
        log(`[reject] 散布図の接地に失敗 (相関 snapshot に無い): ${scatter.stderr.trim().slice(0, 160)}`);
        fs.rmSync(dir, { recursive: true, force: true });
        counters.rejected++;
        continue;
      }
      scatterBase = `${aKey}--${bKey}-scatter`;
      secondMetric = {
        rankingKey: second.rankingKey,
        label: second.title,
        unit: second.unit,
        year: second.year,
        source: second.source,
        rows: second.data.map((r) => ({
          rank: r.rank as number,
          areaName: r.areaName as string,
          value: r.value as number,
        })),
      };
    }

    // --- 3. SVG 生成 ---
    const charted = run("npx", [
      "tsx",
      ".claude/scripts/blog/generate-article-charts.ts",
      "--slug",
      slug,
    ]);
    if (!charted.ok) {
      log(`[reject] チャート生成に失敗: ${charted.stderr.trim().slice(0, 200)}`);
      fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }

    // --- 4. prompt 組み立て ---
    const metric: GroundTruthMetric = {
      rankingKey: payload.rankingKey,
      label: payload.title,
      unit: payload.unit,
      year: payload.year,
      source: payload.source,
      rows: payload.data.map((r) => ({
        rank: r.rank as number,
        areaName: r.areaName as string,
        value: r.value as number,
      })),
    };
    const allowedLinks = await buildAllowedLinks(payload.rankingKey, payload.data);
    if (secondMetric) {
      // カードは 1 枚だけ (dup-ranking-link を避ける) なので、第2指標へはテキストリンクで導線を作る。
      allowedLinks.unshift({
        href: `/ranking/${secondMetric.rankingKey}`,
        label: `${secondMetric.label}ランキング`,
      });
    }
    const promptInput = {
      slug,
      archetype: (topic.archetype as BlogArchetype) ?? "A",
      suggestedTitle: topic.suggestedTitle,
      metrics: secondMetric ? [metric, secondMetric] : [metric],
      figures: scatterBase
        ? [
            {
              caption: `${metric.label}のランキング (上位5+下位5)`,
              markdown: `![${metric.label}の上位と下位](data/${slug}-prefecture-rankings.svg)`,
            },
            {
              caption: `${secondMetric?.label}のランキング (上位5+下位5)`,
              markdown: `![${secondMetric?.label}の上位と下位](data/${secondMetric?.rankingKey}-prefecture-rankings.svg)`,
            },
            {
              caption: "2 指標の散布図 (相関の可視化)",
              markdown: `![${metric.label}と${secondMetric?.label}の関係](data/${scatterBase}.svg)`,
            },
          ]
        : [
            {
              caption: "ランキング (上位5+下位5)",
              markdown: `![${payload.title}の上位と下位](data/${slug}-prefecture-rankings.svg)`,
            },
            {
              caption: "地理分布のタイルマップ",
              markdown: `![${payload.title}の地理分布](data/${slug}-map.svg)`,
            },
          ],
      sourceLinkHref: `/ranking/${payload.rankingKey}`,
      sourceLinkLabel: `${payload.title}ランキングをもっと見る`,
      allowedLinks,
    };

    if (DRY_RUN) {
      const prompt = buildBlogArticlePrompt(promptInput);
      log(
        `[dry-run] データ健全 / prompt ${prompt.length.toLocaleString()} 文字 / リンク候補 ${allowedLinks.length} 件`,
      );
      log(
        `[dry-run] 図 ${promptInput.figures.length} 枚・指標 ${promptInput.metrics.length} 件・` +
          `接地 ${metric.rows.length} 県 (${metric.year}年 ${metric.unit})`,
      );
      // dry-run は「書ける状態か」を確かめるだけなので接地物を残さない。
      // 残すと article.md の無いディレクトリが outbox に溜まり、公開 workflow の検出を汚す。
      fs.rmSync(dir, { recursive: true, force: true });
      counters.ok++;
      continue;
    }

    // --- 5. prompt を書き出してセッションに渡す ---
    //
    // ここで LLM を呼ばない。書くのは Claude Code routine / 対話セッションの担当で、
    // このスクリプトは決定的な部分 (接地・健全性ゲート・SVG・prompt 構築) だけを持つ。
    // セッションが article.md を書いたら `--ingest <slug>` でゲートに掛ける。
    const promptPath = path.join(dir, "article.prompt.txt");
    fs.writeFileSync(promptPath, ensureTrailingNewline(buildBlogArticlePrompt(promptInput)));
    log(
      `[ready] ${slug} — 接地 ${metric.rows.length} 県 / 図 ${promptInput.figures.length} 枚 / ` +
        `リンク候補 ${allowedLinks.length} 件。prompt: ${path.relative(PROJECT_ROOT, promptPath)}`,
    );
    counters.ok++;
  }

  log(
    `\n生成: OK ${counters.ok} / REJECT ${counters.rejected} / FAIL ${counters.fail} / SKIP ${counters.skip}`,
  );
  const outcome = decideOutcome(counters, targets.length, { dryRun: DRY_RUN });
  if (outcome.exitCode !== 0) {
    process.stderr.write(`::error::[generate-blog-article] ${outcome.reason}\n`);
    process.exitCode = outcome.exitCode;
  }
}

main().catch((err) => {
  process.stderr.write(
    `::error::[generate-blog-article] ${err instanceof Error ? err.message : String(err)}\n`,
  );
  process.exit(2);
});
