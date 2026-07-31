import "dotenv/config";

/**
 * generate-blog-article.ts — ブログ新規記事の無人生成 orchestrator。
 *
 * `generate-parallel.ts` (ランキング ai-content) のブログ版。同じ思想で組む:
 *   入力  : topic-queue (何を書くか) + R2 観測値 (数値の出どころ)
 *   生成  : Gemini API 直叩き (CLI 非依存。CI で無人運転できる)
 *   ゲート: quality-gate.mjs で blocker 0 のものだけ採用。**ゲートを緩めて通すことはしない**
 *   出力  : docs/21_ブログ記事原稿/<slug>/ (git outbox)。R2 直書きしない
 *           → develop へ push すると blog-auto-publish.yml が再検証して R2 公開まで実行する
 *
 * ## 工程
 *
 *   1. topic-queue から pending を取る
 *   2. R2 観測値を接地 (fetch-ranking-data-r2.mjs)
 *   3. **データ健全性ゲート** (blog-topic-gate)。壊れた metric の記事は書かない
 *   4. SVG 生成 (generate-article-charts.ts)
 *   5. Gemini で本文生成 → quality-gate → 落ちたら指摘を添えて再試行
 *   6. **別コンテキストの Gemini で critic レビュー** → review.md
 *   7. verdict PASS なら published:true にして再度ゲート → 確定
 *
 * ## critic を同じモデルにしてよいのか
 *
 * `blog-quality-standards.md` が禁じているのは「**書いた本人が自己採点して公開する**」ことです。
 * critic には記事本文だけを渡し、ground truth も型の指示も再試行履歴も渡しません。文脈が違えば
 * 独立した読者として読めるので、この構造は保たれます。人間 (または別 agent) のレビューに
 * 比べて弱いのは事実なので、公開後の実測 (GSC) と是正ループで品質を上げます。
 *
 * CLI:
 *   GEMINI_API_KEY=... npx tsx packages/ai-content/src/scripts/generate-blog-article.ts \
 *     [--limit N] [--topic <topicKey>] [--retries N] [--dry-run] [--keep-draft]
 *
 *   --dry-run    : Gemini を呼ばず、接地・ゲート・prompt 長までを実行する (課金なし)
 *   --keep-draft : ゲート落ち / critic REVISE でも下書きを残す (既定は破棄)
 *
 * 正典: .claude/rules/blog-quality-standards.md / .claude/rules/blog-data-schema.md §0
 */

import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { gateTopicData, type GroundedRow } from "../services/blog-topic-gate";
import { generateContentText, resolveTextModel } from "../services/gemini-text-client";
import { decideOutcome } from "../services/generation-outcome";
import {
  buildBlogArticlePrompt,
  buildBlogCriticPrompt,
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
const RETRIES = Number(getArg("--retries") ?? "1");
const DRY_RUN = args.includes("--dry-run");
const KEEP_DRAFT = args.includes("--keep-draft");

/**
 * v1 が扱う型。**単一指標の型に限る**。
 *
 * 型B (相関) を外しているのは実装の都合ではなく、**散布図が無いと成立しない型**だからです。
 * 2 指標の関係を論じる記事に、主指標だけのランキング図と地図を貼っても問いに答えられません
 * (dry-run で実際にその形になることを確認しました)。散布図の接地 (fetch-correlation-scatter)
 * を通してから解禁します。それまでは黙って劣化した記事を書くより、書かない方を選びます。
 */
const SUPPORTED_ARCHETYPES = new Set(["A", "C", "D", "D2", "F", "G"]);

interface TopicEntry {
  topicKey: string;
  archetype: string;
  metricKeys: string[];
  label: string;
  suggestedTitle: string;
  status: string;
  lane: string;
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
  const base = `${primary}-prefecture-gap`;
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

async function main() {
  if (!fs.existsSync(QUEUE)) {
    process.stderr.write(`::error::topic-queue がありません: ${QUEUE}\n`);
    process.exit(1);
  }
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey && !DRY_RUN) {
    process.stderr.write("::error::GEMINI_API_KEY が未設定です (--dry-run なら不要)\n");
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
    const fetched = run("node", [
      ".claude/scripts/blog/fetch-ranking-data-r2.mjs",
      "--slug",
      slug,
      "--keys",
      topic.metricKeys.join(","),
      "--with-map",
    ]);
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
    const promptInput = {
      slug,
      archetype: (topic.archetype as BlogArchetype) ?? "A",
      suggestedTitle: topic.suggestedTitle,
      metrics: [metric],
      figures: [
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
      log(`[dry-run] 図 2 枚・接地 ${metric.rows.length} 県 (${metric.year}年 ${metric.unit})`);
      // dry-run は「書ける状態か」を確かめるだけなので接地物を残さない。
      // 残すと article.md の無いディレクトリが outbox に溜まり、公開 workflow の検出を汚す。
      fs.rmSync(dir, { recursive: true, force: true });
      counters.ok++;
      continue;
    }

    // --- 5. 本文生成 + ゲート再試行 ---
    const articlePath = path.join(dir, "article.md");
    let gate = { pass: false, blockers: ["未生成"] as string[] };
    for (let attempt = 0; attempt <= RETRIES; attempt++) {
      const prompt = buildBlogArticlePrompt({
        ...promptInput,
        previousBlockers: attempt === 0 ? undefined : gate.blockers,
      });
      try {
        const res = await generateContentText({
          prompt,
          apiKey: apiKey as string,
          model: resolveTextModel(),
        });
        fs.writeFileSync(articlePath, ensureTrailingNewline(stripFence(res.text)));
      } catch (e) {
        log(`[fail] 生成エラー (attempt ${attempt + 1}): ${(e as Error).message}`);
        continue;
      }
      gate = runQualityGate(articlePath);
      log(`  attempt ${attempt + 1}: gate ${gate.pass ? "PASS" : `blocker ${gate.blockers.length}`}`);
      if (gate.pass) break;
    }
    if (!gate.pass) {
      log(`[reject] ゲート通過せず: ${gate.blockers.slice(0, 3).join(" / ")}`);
      if (!KEEP_DRAFT) fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }

    // --- 6. critic (別コンテキスト) ---
    let review = "";
    try {
      const res = await generateContentText({
        prompt: buildBlogCriticPrompt(fs.readFileSync(articlePath, "utf8")),
        apiKey: apiKey as string,
        model: resolveTextModel(),
      });
      review = stripFence(res.text);
    } catch (e) {
      log(`[fail] critic 呼び出しエラー: ${(e as Error).message}`);
      if (!KEEP_DRAFT) fs.rmSync(dir, { recursive: true, force: true });
      counters.fail++;
      continue;
    }
    fs.writeFileSync(path.join(dir, "review.md"), ensureTrailingNewline(review));
    const passed = /^verdict:\s*PASS\b/im.test(review);
    log(`  critic: ${passed ? "PASS" : "REVISE"}`);
    if (!passed) {
      log(`[reject] critic が REVISE (下書きは ${KEEP_DRAFT ? "残す" : "破棄"})`);
      if (!KEEP_DRAFT) fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }

    // --- 7. 公開フラグを立てて最終ゲート ---
    const publishedBody = fs
      .readFileSync(articlePath, "utf8")
      .replace(/^published:\s*false\s*$/m, "published: true")
      .replace(/^publishedAt:\s*未定\s*$/m, `publishedAt: ${today()}`);
    fs.writeFileSync(articlePath, publishedBody);
    const finalGate = runQualityGate(articlePath);
    if (!finalGate.pass) {
      log(`[reject] 公開フラグ後のゲートで落ちた: ${finalGate.blockers.slice(0, 2).join(" / ")}`);
      if (!KEEP_DRAFT) fs.rmSync(dir, { recursive: true, force: true });
      counters.rejected++;
      continue;
    }
    log(`[ok] ${slug} — 公開待ち (develop へ push すると blog-auto-publish が公開します)`);
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
