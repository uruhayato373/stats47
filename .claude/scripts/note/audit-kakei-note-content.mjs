#!/usr/bin/env node
// a-kakei-<pref> note記事の draft.md 本文を決定的に監査する (数値/必須語/NG語/画像/リンク/文字数/
// frontmatter/根拠SSOT の8種 + ローカル svg-lint + --live の note API 実測)。
// CLI 流儀は audit-note-figure-split.mjs に合わせる。
//
// 使い方:
//   node audit-kakei-note-content.mjs [slug-regex] [--live] [--no-files]
// 既定 slug-regex: ^a-kakei-
// --no-files : images / svg-lint の「ファイル未生成」を非致命 (skipped) として扱う
//              (画像生成・チャートSVG生成が別ワークパッケージの担当で、まだ無い状態を許容する)
// --live     : note API を叩いて公開後の <figure> 分断・hashtags を実測する (書き込みはしない)
//
// exit 0 = 全 PASS (skip を除く) / 1 = NG あり / 2 = 入力 (draft.md 等) 欠損
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { auditDraft } from "./lib/kakei-note-audit.mjs";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "..", "..");
const OUT_BASE = path.join(ROOT, "docs/31_note記事原稿");
const OUT_JSON = "/tmp/kakei-note-content-audit.json";
const GENERATE_ARTICLE_CHARTS = path.join(ROOT, ".claude/scripts/blog/generate-article-charts.ts");

const flags = process.argv.slice(2).filter((a) => a.startsWith("--"));
const noFiles = flags.includes("--no-files");
const live = flags.includes("--live");
const positional = process.argv.slice(2).find((a) => !a.startsWith("--"));
const slugRe = new RegExp(positional || "^a-kakei-");

function listDirFiles(dir) {
  return fs.existsSync(dir) ? fs.readdirSync(dir) : [];
}

// ---------- check 9: svg-lint (ローカルのみ) ----------

async function runSvgLint(slugDir, slug) {
  const dataDir = path.join(slugDir, "data");
  const svgFiles = listDirFiles(dataDir).filter((f) => f.endsWith(".svg"));
  if (svgFiles.length === 0) {
    if (noFiles) return { id: "svg-lint", ok: false, skipped: true, detail: "skipped (files absent)" };
    return { id: "svg-lint", ok: false, detail: "data/*.svg が1件も無い" };
  }
  try {
    const { lintSvgContent } = await import("../lib/svg-lint.mjs");
    const problems = [];
    for (const f of svgFiles) {
      const content = fs.readFileSync(path.join(dataDir, f), "utf8");
      const report = lintSvgContent(content, f);
      if (report?.errors?.length) problems.push(`${f}: ${report.errors.join("; ")}`);
    }
    return {
      id: "svg-lint",
      ok: problems.length === 0,
      detail: problems.length === 0 ? `data/*.svg ${svgFiles.length}件 lint-clean` : problems.join(" / "),
    };
  } catch {
    // import できない環境向けフォールバック: generate-article-charts.ts --validate を child_process で実行
    try {
      execFileSync(
        "npx",
        ["tsx", GENERATE_ARTICLE_CHARTS, "--slug", slug, "--base", "docs/31_note記事原稿", "--validate"],
        { cwd: ROOT, stdio: "pipe" },
      );
      return { id: "svg-lint", ok: true, detail: "generate-article-charts.ts --validate が exit 0" };
    } catch (e2) {
      return { id: "svg-lint", ok: false, detail: `lint失敗: ${e2.message.split("\n")[0]}` };
    }
  }
}

// ---------- check 10: live-figures (--live のみ) ----------

const stripMd = (s) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/\s+/g, "")
    .trim();

/** figure-split.mjs の draftBlocks(slug) は絶対パスをハードコードしているため、
 * ここでは同じ規則を markdown 文字列に対して再実装する (worktree でも動く)。 */
function draftBlocksFromMarkdown(markdown) {
  const body = markdown.replace(/^---\n[\s\S]*?\n---\n?/, "");
  const out = [];
  for (const raw of body.split(/\n{2,}/)) {
    const line = raw.trim();
    if (!line) continue;
    if (/^!\[[^\]]*\]\([^)]+\)$/.test(line)) {
      out.push({ kind: "image" });
      continue;
    }
    const h = line.match(/^(#{2,6})\s+(.*)$/);
    if (h) {
      out.push({ kind: "heading", level: h[1].length, text: stripMd(h[2]) });
      continue;
    }
    out.push({ kind: "para", text: stripMd(line) });
  }
  return out;
}

async function runLiveFigures(markdown) {
  const fm = (markdown.match(/^---\n([\s\S]*?)\n---/) || [])[1] || "";
  const url = (fm.match(/^note_url:\s*(?:"(.+?)"|(.+?))\s*$/m) || []).slice(1).find(Boolean) || "";
  const key = (url.match(/n[0-9a-f]{8,}/) || [])[0] || "";
  if (!key) return { id: "live-figures", ok: false, detail: "frontmatter に note_url が無い" };

  let note = null;
  for (let i = 1; i <= 4; i++) {
    try {
      const r = await fetch(`https://note.com/api/v3/notes/${key}?ts=${Date.now()}`);
      if (r.ok) {
        note = (await r.json()).data;
        break;
      }
    } catch {
      /* retry */
    }
    await new Promise((res) => setTimeout(res, 700 * i));
  }
  if (!note) return { id: "live-figures", ok: false, detail: "note API 取得に失敗" };

  const { misplacedFiguresFrom, publishedBlocks } = await import("./lib/figure-split.mjs");
  const dblocks = draftBlocksFromMarkdown(markdown);
  const misplaced = misplacedFiguresFrom(dblocks, note.body);
  const figureCount = publishedBlocks(note.body).filter((b) => b.tag === "figure").length;
  const hashtagCount = note.hashtag_notes?.length || 0;
  // ナビゲーションフッタ (次に読む + 商品カード) は公開後に付与される draft.md 外のブロックで、
  // 本文の5枚に加えて figure を2枚増やす (2026-09-15 実測: 全47本で確認)。フッタ分は
  // misplacedFiguresFrom が draft.md 外として無視するため、figure数は「5以上」で判定する。
  const ok = figureCount >= 5 && misplaced.length === 0 && hashtagCount >= 95;
  return {
    id: "live-figures",
    ok,
    detail: `figures=${figureCount} misplaced=${misplaced.length} hashtags=${hashtagCount}`,
  };
}

// ---------- 1 slug 分の監査 ----------

async function auditSlug(slug) {
  const slugDir = path.join(OUT_BASE, slug);
  const draftPath = path.join(slugDir, "draft.md");
  const chartDataPath = path.join(slugDir, "chart-data.json");
  const evidenceDataPath = path.join(slugDir, "evidence-data.json");
  if (![draftPath, chartDataPath, evidenceDataPath].every((p) => fs.existsSync(p))) {
    return { slug, missingInput: true };
  }

  const markdown = fs.readFileSync(draftPath, "utf8");
  const chartData = JSON.parse(fs.readFileSync(chartDataPath, "utf8"));
  const evidenceData = JSON.parse(fs.readFileSync(evidenceDataPath, "utf8"));
  const dataDir = path.join(slugDir, "data");
  const dataFiles = listDirFiles(dataDir);
  const dataJson = {};
  for (const f of dataFiles) {
    if (!f.endsWith(".json") || f.endsWith(".source.json")) continue;
    try {
      dataJson[f] = JSON.parse(fs.readFileSync(path.join(dataDir, f), "utf8"));
    } catch {
      /* checkNumbers はこの key が無ければ share/ev1/ev2 由来の追加数値を許容集合に加えないだけ */
    }
  }
  const files = {
    images: listDirFiles(path.join(slugDir, "images")),
    data: dataFiles,
    dataJson,
  };

  const { checks } = auditDraft({ markdown, chartData, evidenceData, files }, { noFiles });

  checks.push(await runSvgLint(slugDir, slug));
  if (live) checks.push(await runLiveFigures(markdown));

  const ok = checks.filter((c) => !c.skipped).every((c) => c.ok);
  return { slug, ok, checks };
}

async function main() {
  if (!fs.existsSync(OUT_BASE)) {
    console.error(`入力ディレクトリが無い: ${OUT_BASE}`);
    process.exit(2);
  }
  const slugs = fs
    .readdirSync(OUT_BASE)
    .filter((d) => slugRe.test(d))
    .sort();
  if (slugs.length === 0) {
    console.error(`対象 slug が無い (regex: ${slugRe})`);
    process.exit(2);
  }

  const results = [];
  for (const slug of slugs) results.push(await auditSlug(slug));
  fs.writeFileSync(OUT_JSON, JSON.stringify(results, null, 2));

  let missingInput = false;
  let hasNg = false;
  for (const r of results) {
    if (r.missingInput) {
      missingInput = true;
      console.log(`MISSING ${r.slug}: draft.md / chart-data.json / evidence-data.json のいずれかが無い`);
      continue;
    }
    for (const c of r.checks) {
      const mark = c.skipped ? "SKIP" : c.ok ? "PASS" : "FAIL";
      console.log(`${mark} ${r.slug} ${c.id}: ${c.detail}`);
    }
    if (!r.ok) hasNg = true;
  }
  console.log(`\n結果を書き出し: ${OUT_JSON}`);

  if (missingInput) process.exit(2);
  process.exit(hasNg ? 1 : 0);
}

main();
