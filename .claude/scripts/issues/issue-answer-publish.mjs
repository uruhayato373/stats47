#!/usr/bin/env node
/**
 * 問いに答える下書きの公開の前後を 1 コマンドにする (npm run issues:answer)。
 *
 *   npm run issues:answer -- prepare --map K08=household-spending-25-years,K09=seasons-slug
 *   (背景を Codex で作り、published: true にして develop へ push し、公開の run が成功したら)
 *   npm run issues:answer -- link
 *
 * prepare: 問いが実在して未回答か・下書きがあるかを確かめ、4 型の仮の割り当て (type:paper) を足し、
 *   記事ごとに quality-gate・factual-check・審査 (review.md の PASS と articleSha256 の一致)・背景の有無を表にする。
 *   背景の無い記事は Codex の依頼 JSON を /tmp/claude-req-<slug>.json に作る (生成は Codex MCP の工程。ここでは呼ばない)。
 * link: 仮の割り当ての理由文から問いと記事の組を読み、R2 に公開済みの記事だけ、ページ索引を作り直して answers を足し、
 *   仮の割り当てを消し、本の論点 (analyses.json の issueIds) の展開記録を done にする。最後に issues:check と content-types:check を通す。
 *
 * 手作業でこの順を 8 手打っていた (2026-11-09 の 10 本)。順序を逆にすると check-datasets の外部キー検査で止まる
 * (manage-issue-ledger SKILL.md §5)。R2 への書き込み・push・背景の生成はしない。
 */
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { datasetDir, datasetPath } from "../../../config/datasets.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const TYPES_PATH = path.join(ROOT, datasetPath("content.types"));
const LINKS_PATH = path.join(ROOT, datasetPath("content.issue-links"));
const ISSUES_PATH = path.join(ROOT, datasetPath("content.issues"));
const EXPANSION_PATH = path.join(ROOT, datasetPath("source-inventory.expansion"));
/** 参考文献ごとの分析企画 (<資料>/<版>/analyses.json) をすべて読む */
function readBookAnalyses() {
  const base = path.join(ROOT, datasetDir("source-inventory.analyses"));
  return fs.readdirSync(base, { withFileTypes: true }).filter((d) => d.isDirectory()).flatMap((book) =>
    fs.readdirSync(path.join(base, book.name), { withFileTypes: true }).filter((d) => d.isDirectory())
      .map((edition) => path.join(base, book.name, edition.name, "analyses.json"))
      .filter((file) => fs.existsSync(file))
      .flatMap((file) => readJson(file).analyses ?? []));
}
const require = createRequire(import.meta.url);
const { R2_PUBLIC_BASE_URL } = require("../lib/site-config.cjs");
const R2_BASE = process.env.R2_PUBLIC_FETCH_URL || R2_PUBLIC_BASE_URL;
const REASON = (issue) => `問い ${issue} に答える下書き。公開後に issue-links の answers を足したら、この行を消して導出に任せる`;
const REASON_RE = /^問い (issue:[A-Z]\d{2}(?:-\d+)?) に答える下書き。/;

const readJson = (p) => JSON.parse(fs.readFileSync(p, "utf8"));
/** 既存ファイルの字下げを保って書く (差分を追加行だけにする) */
function writeJsonLike(p, data) {
  const raw = fs.readFileSync(p, "utf8");
  const indent = /\n( +)"/.exec(raw)?.[1].length ?? 2;
  fs.writeFileSync(p, `${JSON.stringify(data, null, indent)}\n`);
}
const run = (cmd, args, env = {}) =>
  execFileSync(cmd, args, { cwd: ROOT, encoding: "utf8", env: { ...process.env, ...env }, stdio: ["ignore", "pipe", "pipe"] });
const tryRun = (cmd, args, env) => {
  try {
    return { ok: true, out: run(cmd, args, env) };
  } catch (e) {
    return { ok: false, out: `${e.stdout ?? ""}${e.stderr ?? ""}` };
  }
};

function parseMap(text) {
  if (!text) throw new Error("--map K08=slug,K09=slug が要る");
  return text.split(",").map((pair) => {
    const [key, slug] = pair.split("=").map((s) => s.trim());
    if (!key || !slug) throw new Error(`--map の形が違う: ${pair}`);
    return { issue: key.startsWith("issue:") ? key : `issue:${key}`, slug };
  });
}

function reviewState(dir) {
  const article = fs.readFileSync(path.join(dir, "article.md"));
  const sha = crypto.createHash("sha256").update(article).digest("hex");
  const reviewPath = path.join(dir, "review.md");
  if (!fs.existsSync(reviewPath)) return "審査なし";
  const review = fs.readFileSync(reviewPath, "utf8");
  const verdict = review.match(/^verdict:\s*(\w+)/m)?.[1] ?? "?";
  const reviewed = review.match(/^articleSha256:\s*([0-9a-f]{64})/m)?.[1];
  if (reviewed !== sha) return `${verdict} (審査後に本文が変わった)`;
  return verdict;
}

function gateState(slug) {
  const r = tryRun("node", [".claude/scripts/blog/quality-gate.mjs", `contents/blog/${slug}/article.md`]);
  try {
    const json = JSON.parse(r.out.slice(r.out.indexOf("{")));
    return json.blockers.length === 0 ? "pass" : `blocker ${json.blockers.length}: ${json.blockers[0].slice(0, 80)}`;
  } catch {
    return `gate を読めない: ${r.out.slice(0, 80)}`;
  }
}

function prepare(pairs) {
  const issues = new Map(readJson(ISSUES_PATH).issues.map((i) => [i.id, i]));
  const answered = new Set(readJson(LINKS_PATH).links.filter((l) => l.role === "answers").map((l) => l.issue));
  const types = readJson(TYPES_PATH);
  const assigned = new Set(types.assignments.map((a) => a.id));
  const problems = [];
  for (const { issue, slug } of pairs) {
    if (!issues.has(issue)) problems.push(`${issue} は台帳に無い`);
    if (answered.has(issue)) problems.push(`${issue} は答えの記事が既にある`);
    if (!fs.existsSync(path.join(ROOT, "contents/blog", slug, "article.md"))) problems.push(`下書きが無い: contents/blog/${slug}`);
  }
  if (problems.length) throw new Error(problems.join("\n"));

  const added = pairs.filter(({ slug }) => !assigned.has(`blog:${slug}`));
  if (added.length) {
    types.assignments.push(...added.map(({ issue, slug }) => ({ id: `blog:${slug}`, type: "type:paper", reason: REASON(issue) })));
    writeJsonLike(TYPES_PATH, types);
  }

  const rows = [];
  for (const { issue, slug } of pairs) {
    const dir = path.join(ROOT, "contents/blog", slug);
    const factual = tryRun("node", [".claude/scripts/lib/article-factual-check.mjs", `contents/blog/${slug}/article.md`]);
    const hasBackground = fs.existsSync(path.join(ROOT, "assets/blog/fullbleed-backgrounds", `${slug}.jpg`));
    if (!hasBackground) {
      const req = tryRun("npm", ["run", "-s", "blog-images:codex", "--", "request-article", "--slug", slug, "--article", `contents/blog/${slug}/article.md`]);
      if (req.ok) fs.writeFileSync(`/tmp/claude-req-${slug}.json`, req.out);
    }
    rows.push([issue, slug, gateState(slug), factual.ok ? "pass" : "fail", reviewState(dir), hasBackground ? "あり" : `依頼 /tmp/claude-req-${slug}.json`]);
  }
  console.log(`4 型の仮の割り当て: ${added.length} 件を足した`);
  console.log("| 問い | slug | quality-gate | factual | 審査 | 背景 |\n|---|---|---|---|---|---|");
  for (const r of rows) console.log(`| ${r.join(" | ")} |`);
  const ready = rows.every((r) => r[2] === "pass" && r[3] === "pass" && r[4] === "PASS" && r[5] === "あり");
  console.log(ready ? "\n全件そろった。published: true にして develop へ push する" : "\nそろっていない行がある。直してから再実行する");
  if (!ready) process.exitCode = 1;
}

async function isPublished(slug) {
  const res = await fetch(`${R2_BASE}/app/blog/${slug}/article.md`, { method: "HEAD" });
  return res.ok;
}

async function link() {
  // 公開の run は送り箱の掃除と sitemap・known-tag-keys の追随を develop へ書き戻す。取り込む前に索引を作ると
  // タグの索引が古いまま残り、develop の content-identity-navigation が止まる (2026-11-09)
  tryRun("git", ["fetch", "-q", "origin", "develop"]);
  const behind = tryRun("git", ["rev-list", "--count", "HEAD..origin/develop"]);
  if (behind.ok && Number(behind.out.trim()) > 0) {
    throw new Error(`origin/develop が ${behind.out.trim()} コミット先にある。公開の run の書き戻しを git pull してから link する`);
  }
  const types = readJson(TYPES_PATH);
  const pending = types.assignments
    .map((a) => ({ a, issue: REASON_RE.exec(a.reason ?? "")?.[1] }))
    .filter((x) => x.issue && x.a.id.startsWith("blog:"))
    .map(({ a, issue }) => ({ issue, slug: a.id.slice("blog:".length) }));
  if (pending.length === 0) {
    console.log("仮の割り当ての下書きは無い");
    return;
  }
  const published = [];
  for (const p of pending) if (await isPublished(p.slug)) published.push(p);
  const waiting = pending.filter((p) => !published.includes(p));
  if (published.length === 0) {
    console.log(`R2 にまだ無い: ${waiting.map((p) => p.slug).join(", ")}`);
    process.exitCode = 1;
    return;
  }

  run("npm", ["run", "-s", "content:sync", "--", "--from-r2"], { R2_PUBLIC_FETCH_URL: R2_BASE, NODE_OPTIONS: "--conditions react-server" });
  run("npm", ["run", "-s", "metrics:build-index"]);

  const links = readJson(LINKS_PATH);
  const answered = new Set(links.links.filter((l) => l.role === "answers").map((l) => l.issue));
  const added = published.filter(({ issue }) => !answered.has(issue));
  for (const { issue, slug } of added) links.links.push({ issue, page: `blog:${slug}`, role: "answers" });
  writeJsonLike(LINKS_PATH, links);
  const done = new Set(published.map((p) => `blog:${p.slug}`));
  types.assignments = types.assignments.filter((a) => !done.has(a.id));
  writeJsonLike(TYPES_PATH, types);

  const recorded = [];
  {
    const bySlug = new Map(published.map((p) => [p.issue, p.slug]));
    // 展開記録は履歴を足していく台帳なので、同じ done の記録は 2 度書かない
    const done = new Set(readJson(EXPANSION_PATH).records.filter((r) => r.channel === "blog" && r.status === "done").map((r) => `${r.analysis} ${r.target}`));
    for (const analysis of readBookAnalyses()) {
      const hit = (analysis.issueIds ?? []).find((id) => bySlug.has(id));
      if (!hit || done.has(`${analysis.id} blog:${bySlug.get(hit)}`)) continue;
      run("node", [".claude/scripts/source-vault/reference-expansion.mjs", "record", "--analysis", analysis.id, "--channel", "blog", "--status", "done", "--target", `blog:${bySlug.get(hit)}`, "--by", "blog-seo-strategist"]);
      recorded.push(analysis.id);
    }
  }
  run("npm", ["run", "-s", "issues:check"]);
  run("npm", ["run", "-s", "content-types:check"]);
  console.log(`answers を足した: ${added.length} 件 ${added.map((p) => `${p.issue}→${p.slug}`).join(", ")}`);
  console.log(`仮の割り当てを消した: ${published.length} 件`);
  console.log(`本の論点の展開記録: ${recorded.length} 件 ${recorded.join(", ")}`);
  if (waiting.length) console.log(`R2 にまだ無いので残した: ${waiting.map((p) => p.slug).join(", ")}`);
}

const [command, ...rest] = process.argv.slice(2);
const mapIndex = rest.indexOf("--map");
try {
  if (command === "prepare") prepare(parseMap(mapIndex >= 0 ? rest[mapIndex + 1] : undefined));
  else if (command === "link") await link();
  else {
    console.error("使い方: npm run issues:answer -- prepare --map K08=<slug>,... | link");
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
