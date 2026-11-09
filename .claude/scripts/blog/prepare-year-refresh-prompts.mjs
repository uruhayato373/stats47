#!/usr/bin/env node
/**
 * 公開中の家計調査のブログを最新年の値へ書き直すための、headless 執筆の入力 (article.prompt.txt) を作る。
 * 書き直し本体は write-blog-headless.ts (repo 外 cwd・ツール無しの `claude -p` → 決定的ゲート → 別プロセスの critic) が行う。
 *
 *   node .claude/scripts/blog/prepare-year-refresh-prompts.mjs --slugs a,b,c
 *   npx tsx packages/ai-content/src/scripts/write-blog-headless.ts --slugs a,b,c --effort low   # ユーザー端末で
 *
 * 1 本ごとに:
 *   1. contents/blog/<slug>/article.md が無ければ公開版を取り出して図を最新年で取り直す
 *      (refresh-article-data-years.mjs --pull --apply → generate-article-charts.ts で暗い版も作る)
 *   2. published を false にする (審査前の原稿を公開しない。critic 必須の gate も公開版にだけ掛かる)
 *   3. article.prompt.txt を書く: 書き直しの規則 + 図の data の要約 (順位つき) + 機械の照合で見つかった食い違い
 *      (article-factual-check の blocker / VALUE_MISMATCH、find-kakei-stale-title-values --local の題の旧値) + 現在の本文
 *
 * なぜ: 2026-11-09 に 109 本を Agent (article-writer / blog-critic) のワークフローで回したところ、95 本の書き直しだけで
 * 入力 約 3 億 2,600 万トークン (キャッシュ読み込み込み) を使った。subagent は起動のたびに CLAUDE.md と rules を読み、
 * 取り出し・図の作り直し・照合をモデルのやり取りで行っていた。決定的な部分をここへ寄せ、モデルには本文の書き換えだけを頼む。
 * 公開は人が published: true に戻して develop へ push する。
 */
import { spawnSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUTBOX = path.join(ROOT, "contents/blog");
const MAX_OTHER_JSON_CHARS = 2000;

const args = process.argv.slice(2);
const slugsArg = args[args.indexOf("--slugs") + 1];
if (!args.includes("--slugs") || !slugsArg || args.includes("--help")) {
  console.error("使い方: node .claude/scripts/blog/prepare-year-refresh-prompts.mjs --slugs a,b,c");
  process.exit(args.includes("--help") ? 0 : 2);
}
const slugs = slugsArg.split(",").map((s) => s.trim()).filter(Boolean);

const run = (cmd, cmdArgs) => spawnSync(cmd, cmdArgs, { cwd: ROOT, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });

/** 図の data JSON を、モデルが順位と値を読み違えない短い表にする */
function summarizeData(dir) {
  const dataDir = path.join(dir, "data");
  if (!fs.existsSync(dataDir)) return "(data なし)";
  const out = [];
  for (const file of fs.readdirSync(dataDir).sort()) {
    if (!file.endsWith(".json") || file.endsWith(".source.json")) continue;
    let json;
    try {
      json = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8"));
    } catch {
      continue;
    }
    const head = `### ${file} — ${json.title ?? ""} ${json.subtitle ?? ""} ${json.year ? `(${json.year})` : ""} 単位: ${json.unit ?? "?"}`;
    const rows = Array.isArray(json.data) ? json.data.filter((r) => r && typeof r.value === "number" && (r.areaName || r.name)) : [];
    if (rows.length >= 10) {
      const sorted = [...rows].sort((a, b) => b.value - a.value);
      const rankOf = (r) => r.rank ?? sorted.findIndex((x) => x.value === r.value) + 1;
      out.push(head, sorted.map((r) => `${rankOf(r)}位 ${r.areaName ?? r.name} ${r.value}`).join(" / "));
    } else {
      out.push(head, JSON.stringify(json).slice(0, MAX_OTHER_JSON_CHARS));
    }
  }
  return out.join("\n");
}

function factualFindings(articlePath) {
  const r = run("node", [".claude/scripts/lib/article-factual-check.mjs", articlePath]);
  try {
    const j = JSON.parse(r.stdout);
    return [...(j.blockers ?? []), ...(j.warnings ?? [])];
  } catch {
    return [`article-factual-check を読めない: ${(r.stderr || r.stdout).slice(0, 200)}`];
  }
}

function staleTitleFindings(slug) {
  const r = run("node", [".claude/scripts/blog/find-kakei-stale-title-values.mjs", "--json", "--local"]);
  try {
    return JSON.parse(r.stdout)
      .filter((x) => x.slug === slug)
      .map((x) => `題の数値 ${x.value} は ${x.matched} の値 (最新は ${x.latestYear} 年)`);
  } catch {
    return [];
  }
}

/**
 * 県庁所在市の「数量×価格」の要点カードは refresh-article-data-years.mjs が「手作業」に回すので、ここで最新の共通年に作り直す。
 * 県は既存の source.json の prefCode から取る (slug から推測しない)。
 */
function refreshQuantityPrice(slug, dir) {
  const dataDir = path.join(dir, "data");
  if (!fs.existsSync(dataDir)) return;
  for (const file of fs.readdirSync(dataDir)) {
    const m = /^(.*-quantity-price-findings)\.source\.json$/.exec(file);
    if (!m) continue;
    const prefCode = JSON.parse(fs.readFileSync(path.join(dataDir, file), "utf8")).prefCode;
    if (!prefCode) continue;
    const r = run("node", [".claude/scripts/blog/build-kakei-quantity-price.mjs", "--slug", slug, "--pref", prefCode, "--base-dir", "contents/blog", "--data-name", m[1]]);
    if (r.status !== 0) console.log(`${slug}: 数量×価格の作り直しに失敗 (${(r.stderr || r.stdout).trim().split("\n").at(-1)})`);
    else run("npx", ["tsx", ".claude/scripts/blog/generate-article-charts.ts", "--slug", slug]);
  }
  // 執筆用の全品目表は data/ の外に書かれ、送り箱に残ると公開されうるので消す (要点カードの data JSON が根拠)
  fs.rmSync(path.join(dir, "kakei-quantity-price.json"), { force: true });
}

const RULES = `# 依頼
下の「現在の本文」は、公開中の統計記事を家計調査の最新年 (2025 年) へ更新している途中の原稿です。図の data はすでに 2025 年に取り直してあります。
本文・題 (title / seoTitle / subtitle / description) を、下の「図の data」に合わせて直した article.md の全文を出力してください。

# 絶対ルール
- 数値・順位は「図の data」にあるものだけを書く。data に無い数値を記憶や推測で足さない。根拠の無い数値は文ごと削る
- 値を直したら、同じ値の出現箇所を題・説明文・見出し・本文・まとめのすべてで直す
- 順位が入れ替わって題・見出し・結論が成り立たなくなったら、data に合わせて主張から書き直す。題に「N位」を入れない
- 家計調査は県庁所在市の二人以上の世帯の値で、県全体ではない。単年の順位はぶれが大きいので、構造を断定せず理由は [仮説] として書く
- 前年 (2024 年) との比較を書くときは、data に前年の値が無ければ数値を書かず「前年は首位だった」のような順位の言及にとどめる
- frontmatter は published: false のまま、updatedAt は 2026-11-09 にする。ほかの frontmatter の項目と、![...](data/*.svg) の画像参照・<source-link> などのタグは消さない
- 機械の照合で見つかった食い違い (下の一覧) をすべて解消する
- 指摘の無い段落は書き換えない。文体 (です・ます) と構成を保つ
- 出力は article.md の中身だけ。前置き・説明・コードフェンスは書かない`;

for (const slug of slugs) {
  const dir = path.join(OUTBOX, slug);
  const articlePath = path.join(dir, "article.md");
  if (!fs.existsSync(articlePath)) {
    const r = run("node", [".claude/scripts/blog/refresh-article-data-years.mjs", "--slug", slug, "--pull", "--apply"]);
    if (r.status !== 0 || !fs.existsSync(articlePath)) {
      console.log(`${slug}: 取り出し失敗 (${(r.stderr || r.stdout).trim().split("\n").at(-1)})`);
      continue;
    }
    run("npx", ["tsx", ".claude/scripts/blog/generate-article-charts.ts", "--slug", slug]);
  }
  refreshQuantityPrice(slug, dir);
  const original = fs.readFileSync(articlePath, "utf8");
  const draft = original.replace(/^published:\s*true\s*$/m, "published: false");
  if (draft !== original) fs.writeFileSync(articlePath, draft);

  const findings = [...factualFindings(articlePath), ...staleTitleFindings(slug)];
  const prompt = [
    RULES,
    "",
    "# 機械の照合で見つかった食い違い",
    findings.length ? findings.map((f) => `- ${f}`).join("\n") : "- なし (題・本文の言い回しを data に合わせて点検する)",
    "",
    "# 図の data (2025 年)",
    summarizeData(dir),
    "",
    "# 現在の本文",
    draft,
  ].join("\n");
  fs.writeFileSync(path.join(dir, "article.prompt.txt"), prompt);
  console.log(`${slug}: prompt ${prompt.length.toLocaleString()} 字 / 食い違い ${findings.length} 件`);
}
