/**
 * notebooklm-review.ts — 既刊 Kindle を NotebookLM に読ませ、決めた問いをまとめて聞く (KINDLE-QUALITY-LOOP-01 の 3 段目)。
 *
 *   npx tsx .claude/scripts/kdp/notebooklm-review.ts K-S1-07 K-S1-02
 *
 * - 出品台帳の入稿版 EPUB を Markdown にし (図は「[図: alt]」の 1 行)、1 冊に 1 つの notebook「stats47 Kindle <書籍ID>」へ
 *   入れて「<書籍ID> <EPUB の sha256 先頭 12 桁>」に改名する (`source add --title` はファイルからの追加では効かない)。
 *   同じ題の source があれば入れ直さず、版の違う古い source は消す。
 * - notebook を本ごとに分けるのは、`ask` が既定で前の会話を続け、別の本の答えが混ざるため (2026-11-03 に実際に混ざった)。
 *   聞く前に `clear` で会話を切る。問いは 1 冊につき 1 回の ask にまとめる (Claude は答えだけを読む)。
 * - 答えは .local/kindle-quality/<id>/notebooklm.md に保存する。入れるのは自分の本だけ (他人の本・参考文献は入れない)。
 * - 前提: `notebooklm` CLI (~/bin/notebooklm) が login 済み。
 */
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { parseEpub } from "../../../packages/product-factory/src/channels/kindle/epub-inspect";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../../..");
const NOTEBOOK_PREFIX = "stats47 Kindle";
/** 問いの版。問いを変えたら上げる (前の答えと比べないため) */
const QUESTION_SET = "v1";  // v1 の最初の実行 (共有 notebook) は答えが混ざったので無効
const QUESTIONS = [
  "この本の読者は誰で、どんな問いに答える本ですか。各章はその問いに答えていますか。答えていない章を挙げてください。",
  "図や表が本文で十分に説明されていない箇所 (図の読み方・何を比べているか・単位や年が本文に無い) を、章と図の名前で挙げてください。",
  "同じ説明や注意書きが何度も繰り返されている箇所を挙げてください。",
  "読者が次に知りたくなるのに本書に無い比較・データ (例: 全47都道府県の値、時系列、他の指標との関係) を、章ごとに挙げてください。",
  "本文の数値・順位の主張で、前後の章や図と食い違っているものはありますか。",
  "本文の中で、図か表にしたほうが分かりやすい段落を 5 つまで挙げてください (章の名前と、どんな図・表か)。",
  "書名・はじめにで約束している内容と、実際の中身に食い違いはありますか。",
  "この本の価値を上げるために、いちばん効く改訂を 3 つ、優先順に挙げてください。",
];

function nlm(args: string[]): string {
  return execFileSync("notebooklm", args, { encoding: "utf8", maxBuffer: 32 * 1024 * 1024, timeout: 600_000 });
}

function bookMarkdown(id: string): { markdown: string; sha12: string } {
  const listings = JSON.parse(readFileSync(join(ROOT, "config/kdp-listings.json"), "utf8")).listings as Record<string, { epubPath?: string }>;
  const epubPath = listings[id]?.epubPath;
  if (!epubPath) throw new Error(`${id}: epubPath が出品台帳に無い`);
  const buffer = readFileSync(join(ROOT, epubPath));
  const book = parseEpub(buffer);
  const text = (html: string) =>
    html
      .replace(/<figure\b[\s\S]*?<img\b[^>]*\balt="([^"]*)"[\s\S]*?<\/figure>/gi, "\n[図: $1]\n")
      .replace(/<\/(p|h1|h2|h3|li|tr|aside)>/gi, "\n")
      .replace(/<[^>]+>/g, "")
      .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  const markdown = [`# ${book.title} (${id})`, ...book.chapters.map((chapter) => `## ${chapter.title}\n\n${text(chapter.body)}`)].join("\n\n");
  return { markdown, sha12: createHash("sha256").update(buffer).digest("hex").slice(0, 12) };
}

const ids = process.argv.slice(2).filter((arg) => /^K-S[1-4]-\d{2}$/.test(arg));
if (!ids.length) throw new Error("usage: notebooklm-review.ts <K-S1-NN>...");

function notebookFor(title: string): string {
  const find = () => (JSON.parse(nlm(["list", "--json"])).notebooks as { id: string; title: string }[]).find((notebook) => notebook.title === title)?.id;
  const existing = find();
  if (existing) return existing;
  nlm(["create", title]);
  const created = find();
  if (!created) throw new Error(`notebook を作れなかった: ${title}`);
  return created;
}

for (const id of ids) {
  const { markdown, sha12 } = bookMarkdown(id);
  const outDir = join(ROOT, ".local/kindle-quality", id);
  mkdirSync(outDir, { recursive: true });
  const mdFile = join(outDir, "book.md");
  writeFileSync(mdFile, `${markdown}\n`);
  const title = `${id} ${sha12}`;
  const notebookId = notebookFor(`${NOTEBOOK_PREFIX} ${id}`);
  const sources = JSON.parse(nlm(["source", "list", "-n", notebookId, "--json"])).sources as { id: string; title: string }[];
  let sourceId = sources.find((source) => source.title === title)?.id;
  for (const old of sources.filter((source) => source.id !== sourceId)) nlm(["source", "delete", old.id, "-n", notebookId, "-y"]);
  if (!sourceId) {
    const added = JSON.parse(nlm(["source", "add", mdFile, "-n", notebookId, "--json"]));
    sourceId = added.id ?? added.source?.id ?? added.source_id;
    if (!sourceId) throw new Error(`${id}: source の ID が返らない: ${JSON.stringify(added).slice(0, 200)}`);
    nlm(["source", "wait", sourceId, "-n", notebookId]);
    nlm(["source", "rename", sourceId, title, "-n", notebookId]);
  }
  nlm(["use", notebookId]);
  nlm(["clear"]);
  const question = `次の問いに、番号ごとに答えてください。本文に書かれていることだけを根拠にし、章の名前を添えてください。\n${QUESTIONS.map((q, i) => `${i + 1}. ${q}`).join("\n")}`;
  const answer = JSON.parse(nlm(["ask", question, "-n", notebookId, "-s", sourceId, "--json"]));
  const body = answer.answer ?? answer.text ?? JSON.stringify(answer);
  writeFileSync(
    join(outDir, "notebooklm.md"),
    `<!-- ${id} source=${title} questions=${QUESTION_SET} asked=${new Date().toISOString()} -->\n\n${body}\n`,
  );
  console.log(`${id}: ${markdown.length} chars → ${title} → answer ${String(body).length} chars`);
}
