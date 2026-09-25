/**
 * plan-svg-text-fix.ts — 記事チャート SVG の「文字のはみ出し・重なり」を、どう直すかで振り分ける。
 *
 * 週次のページ品質監査 (blog_svg_text_issues) が見つけた記事ごとに、公開中の SVG を取得して検査し、
 * 不具合のある SVG だけ data JSON から現行の svg-builder で作り直してもう一度検査する。
 *
 *   regen-fixes      現行の生成器で作り直せば直る → コード変更は不要。R2 へ再生成を反映するだけ (スクリプト)
 *   generator-fix    作り直しても直らない → packages/svg-builder の該当チャートを直す必要がある (agent)
 *   no-data          data JSON が無く作り直せない → 手作業の brushup が要る (オーナー判断)
 *   clean            公開中の SVG に不具合が無い (既に直っている)
 *   unverified       取得に失敗した (不具合の証拠ではない)
 *
 * R2 には書かない。regen-fixes の反映コマンド (regenerate-blog-svgs.yml) を出力するだけで、実行は
 * オーナー承認の上で行う (R2 write は outward-facing。.claude/rules/todo-standards.md §7)。
 *
 * Usage:
 *   npx tsx .claude/scripts/blog/plan-svg-text-fix.ts @.claude/state/page-quality/backlog-batches/<ID>.txt
 *   npx tsx .claude/scripts/blog/plan-svg-text-fix.ts <slug> [<slug> ...] [--json]
 *
 * 正典: .claude/rules/page-quality-standards.md「チャートの文字の検査と修正の振り分け」
 */
import { spawnSync } from "node:child_process";
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { tmpdir } from "node:os";
import path from "node:path";

import { findChartTextIssues } from "../lib/svg-lint.mjs";
import { resolveDispatcher } from "../page-quality/lib/http-dispatcher";

const PROJECT_ROOT = path.resolve(__dirname, "../../..");
const R2_BASE = (process.env.R2_PUBLIC_FETCH_URL ?? "https://storage.stats47.jp").replace(/\/$/, "");
const SVG_REF = /data\/([A-Za-z0-9_.-]+)\.svg/g;

export type Verdict = "regen-fixes" | "generator-fix" | "no-data" | "clean" | "unverified";

export interface SvgPlan {
  slug: string;
  svg: string;
  verdict: Verdict;
  published: string[];
  regenerated: string[];
}

/** batch ファイル (ui-findings のキー 1 行 1 件) または slug の並びから、対象の記事 slug を取り出す。 */
export function parseTargets(args: readonly string[], readFile: (p: string) => string = (p) => readFileSync(p, "utf8")): string[] {
  const slugs = new Set<string>();
  for (const arg of args) {
    if (arg.startsWith("--")) continue;
    const lines = arg.startsWith("@") ? readFile(arg.slice(1)).split(/\r?\n/) : [arg];
    for (const raw of lines) {
      const line = raw.trim();
      if (!line) continue;
      if (!line.includes("|")) {
        slugs.add(line);
        continue;
      }
      // machine|https://stats47.jp/blog/<slug>|blog_svg_text_issues
      const [, url, metric] = line.split("|");
      if (metric !== "blog_svg_text_issues") continue;
      const m = url?.match(/\/blog\/([^/?#]+)/);
      if (m) slugs.add(decodeURIComponent(m[1]));
    }
  }
  return [...slugs];
}

/** 公開中と再生成後の検査結果から振り分ける (純粋関数)。 */
export function classify(published: string[] | null, regenerated: string[] | null | "no-data"): Verdict {
  if (published === null) return "unverified";
  if (published.length === 0) return "clean";
  if (regenerated === "no-data") return "no-data";
  if (regenerated === null) return "unverified";
  return regenerated.length === 0 ? "regen-fixes" : "generator-fix";
}

const describeIssues = (svg: string): string[] => {
  const { overflows, overlaps } = findChartTextIssues(svg);
  return [...overflows.map((o: string) => `はみ出し ${o}`), ...overlaps.map((o: string) => `重なり ${o}`)];
};

async function fetchText(url: string): Promise<string | null> {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(20_000),
        // @ts-expect-error undiciのdispatcherはfetchのRequestInit型に無いが実行時は解釈される
        dispatcher: resolveDispatcher(url),
      });
      if (res.status === 404) return null;
      if (res.ok) return await res.text();
    } catch {
      // 次の試行へ
    }
  }
  return null;
}

async function planSlug(slug: string, workDir: string): Promise<SvgPlan[]> {
  const base = `${R2_BASE}/app/blog/${encodeURIComponent(slug)}`;
  const article = await fetchText(`${base}/article.md`);
  if (article === null) return [{ slug, svg: "(article.md)", verdict: "unverified", published: [], regenerated: [] }];
  const names = [...new Set([...article.matchAll(SVG_REF)].map((m) => m[1]))];
  const plans: SvgPlan[] = [];
  const toRegenerate: string[] = [];
  const publishedIssues = new Map<string, string[] | null>();
  for (const name of names) {
    const svg = await fetchText(`${base}/data/${name}.svg`);
    const issues = svg === null ? null : describeIssues(svg);
    publishedIssues.set(name, issues);
    if (issues && issues.length > 0) toRegenerate.push(name);
  }

  const regenerated = new Map<string, string[] | null | "no-data">();
  if (toRegenerate.length > 0) {
    const dataDir = path.join(workDir, slug, "data");
    mkdirSync(dataDir, { recursive: true });
    writeFileSync(path.join(workDir, slug, "article.md"), article);
    for (const name of toRegenerate) {
      const json = await fetchText(`${base}/data/${name}.json`);
      if (json === null) {
        regenerated.set(name, "no-data");
        continue;
      }
      writeFileSync(path.join(dataDir, `${name}.json`), json);
      const source = await fetchText(`${base}/data/${name}.source.json`);
      if (source !== null) writeFileSync(path.join(dataDir, `${name}.source.json`), source);
    }
    const run = spawnSync(
      process.execPath,
      [path.join(PROJECT_ROOT, "node_modules/tsx/dist/cli.mjs"), ".claude/scripts/blog/generate-article-charts.ts", "--base", workDir, "--slug", slug],
      { cwd: PROJECT_ROOT, encoding: "utf8" }
    );
    for (const name of toRegenerate) {
      if (regenerated.get(name) === "no-data") continue;
      const out = path.join(dataDir, `${name}.svg`);
      regenerated.set(name, run.status === 0 && existsSync(out) ? describeIssues(readFileSync(out, "utf8")) : null);
    }
  }

  for (const name of names) {
    const published = publishedIssues.get(name) ?? null;
    const regen = regenerated.get(name) ?? (published && published.length > 0 ? null : []);
    plans.push({
      slug,
      svg: `${name}.svg`,
      verdict: classify(published, regen),
      published: published ?? [],
      regenerated: Array.isArray(regen) ? regen : [],
    });
  }
  return plans;
}

async function main() {
  const args = process.argv.slice(2);
  const slugs = parseTargets(args);
  if (slugs.length === 0) {
    console.error("対象がありません。@<batch ファイル> か slug を渡してください。");
    process.exit(2);
  }
  const workDir = mkdtempSync(path.join(tmpdir(), "svg-text-fix-"));
  try {
    const plans: SvgPlan[] = [];
    for (const slug of slugs) plans.push(...(await planSlug(slug, workDir)));
    if (args.includes("--json")) {
      console.log(JSON.stringify(plans, null, 2));
      return;
    }
    const bad = plans.filter((p) => p.verdict !== "clean");
    for (const p of bad) {
      console.log(`${p.verdict.padEnd(14)} ${p.slug}/data/${p.svg}`);
      for (const i of (p.verdict === "generator-fix" ? p.regenerated : p.published).slice(0, 3)) console.log(`               - ${i}`);
    }
    const count = (v: Verdict) => plans.filter((p) => p.verdict === v).length;
    console.log(
      `\n合計 ${plans.length} 枚: regen-fixes ${count("regen-fixes")} / generator-fix ${count("generator-fix")} / no-data ${count("no-data")} / clean ${count("clean")} / unverified ${count("unverified")}`
    );
    const regenSlugs = [...new Set(plans.filter((p) => p.verdict === "regen-fixes").map((p) => p.slug))];
    if (regenSlugs.length > 0) {
      console.log("\n再生成で直る記事 (オーナー承認の上で実行):");
      console.log(`  gh workflow run regenerate-blog-svgs.yml -f slugs="${regenSlugs.join(" ")}" -f dry_run=false`);
    }
    if (count("generator-fix") > 0) {
      console.log("\n生成器の修正が必要: packages/svg-builder の該当チャートを直し、長いラベルの fixture テストを足してから再実行する。");
    }
  } finally {
    rmSync(workDir, { recursive: true, force: true });
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(__filename)) {
  void main();
}
